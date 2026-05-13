import { ChildProcess } from 'child_process';
import { CronExpressionParser } from 'cron-parser';
import fs from 'fs';

import path from 'path';

import {
  ASSISTANT_NAME,
  DATA_DIR,
  SCHEDULER_POLL_INTERVAL,
  TIMEZONE,
} from './config.js';
import {
  ContainerOutput,
  runContainerAgent,
  writeTasksSnapshot,
} from './container-runner.js';
import {
  createTask,
  getAllTasks,
  getDueTasks,
  getTaskById,
  logTaskRun,
  updateTask,
  updateTaskAfterRun,
} from './db.js';
import { GroupQueue } from './group-queue.js';
import { resolveGroupFolderPath } from './group-folder.js';
import { logger } from './logger.js';
import { RegisteredGroup, ScheduledTask } from './types.js';

/**
 * Compute the next run time for a recurring task, anchored to the
 * task's scheduled time rather than Date.now() to prevent cumulative
 * drift on interval-based tasks.
 *
 * Co-authored-by: @community-pr-601
 */
export function computeNextRun(task: ScheduledTask): string | null {
  if (task.schedule_type === 'once') return null;

  const now = Date.now();

  if (task.schedule_type === 'cron') {
    const interval = CronExpressionParser.parse(task.schedule_value, {
      tz: TIMEZONE,
    });
    return interval.next().toISOString();
  }

  if (task.schedule_type === 'interval') {
    const ms = parseInt(task.schedule_value, 10);
    if (!ms || ms <= 0) {
      // Guard against malformed interval that would cause an infinite loop
      logger.warn(
        { taskId: task.id, value: task.schedule_value },
        'Invalid interval value',
      );
      return new Date(now + 60_000).toISOString();
    }
    // Anchor to the scheduled time, not now, to prevent drift.
    // Skip past any missed intervals so we always land in the future.
    let next = new Date(task.next_run!).getTime() + ms;
    while (next <= now) {
      next += ms;
    }
    return new Date(next).toISOString();
  }

  return null;
}

export interface SchedulerDependencies {
  registeredGroups: () => Record<string, RegisteredGroup>;
  getSessions: () => Record<string, string>;
  queue: GroupQueue;
  onProcess: (
    groupJid: string,
    proc: ChildProcess,
    containerName: string,
    groupFolder: string,
  ) => void;
  sendMessage: (jid: string, text: string) => Promise<void>;
}

/**
 * Reconcile the group state directory before container spawn.
 * Enforces two invariants at the code level:
 *   1. Orphaned .tmp files are deleted (never promoted)
 *   2. State files with a completed archive counterpart are removed
 * This prevents containers from seeing stale state for finished tasks.
 */
function isTerminalContainerOutput(output: ContainerOutput): boolean {
  if (output.terminal === false) return false;
  return !['assistant_text', 'session_update'].includes(
    output.event_type ?? '',
  );
}

function reconcileStateDir(groupDir: string): void {
  const stateDir = path.join(groupDir, 'state');
  if (!fs.existsSync(stateDir)) return;

  try {
    const files = fs.readdirSync(stateDir);

    for (const file of files) {
      const filePath = path.join(stateDir, file);

      // Skip directories (like archive/)
      try {
        if (fs.statSync(filePath).isDirectory()) continue;
      } catch {
        continue;
      }

      // 1. Delete orphaned .tmp files
      if (file.endsWith('.tmp')) {
        fs.unlinkSync(filePath);
        logger.info(
          { file, groupDir },
          'Deleted orphaned .tmp file from state',
        );
        continue;
      }

      // 2. If archived as complete, remove the stale active-state file
      if (file.endsWith('.json')) {
        const archivePath = path.join(stateDir, 'archive', file);
        if (fs.existsSync(archivePath)) {
          try {
            const archived = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
            if (archived.status === 'complete') {
              fs.unlinkSync(filePath);
              logger.info(
                { file, groupDir },
                'Removed stale state file (archived as complete)',
              );
            }
          } catch {
            /* can't parse archive — leave state file alone */
          }
        }
      }
    }
  } catch (err) {
    logger.warn({ groupDir, err }, 'State reconciliation failed (non-fatal)');
  }
}

async function runTask(
  task: ScheduledTask,
  deps: SchedulerDependencies,
): Promise<void> {
  const startTime = Date.now();
  let groupDir: string;
  try {
    groupDir = resolveGroupFolderPath(task.group_folder);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    // Stop retry churn for malformed legacy rows.
    updateTask(task.id, { status: 'paused' });
    logger.error(
      { taskId: task.id, groupFolder: task.group_folder, error },
      'Task has invalid group folder',
    );
    logTaskRun({
      task_id: task.id,
      run_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      status: 'error',
      result: null,
      error,
    });
    return;
  }
  fs.mkdirSync(groupDir, { recursive: true });

  // Reconcile state before container spawn — code-level enforcement that
  // prevents containers from seeing stale files for archived tasks.
  reconcileStateDir(groupDir);

  logger.info(
    { taskId: task.id, group: task.group_folder },
    'Running scheduled task',
  );

  const groups = deps.registeredGroups();
  const group = Object.values(groups).find(
    (g) => g.folder === task.group_folder,
  );

  if (!group) {
    logger.error(
      { taskId: task.id, groupFolder: task.group_folder },
      'Group not found for task',
    );
    logTaskRun({
      task_id: task.id,
      run_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      status: 'error',
      result: null,
      error: `Group not found: ${task.group_folder}`,
    });
    return;
  }

  // Update tasks snapshot for container to read (filtered by group)
  const isMain = group.isMain === true;
  const tasks = getAllTasks();
  writeTasksSnapshot(
    task.group_folder,
    isMain,
    tasks.map((t) => ({
      id: t.id,
      groupFolder: t.group_folder,
      prompt: t.prompt,
      schedule_type: t.schedule_type,
      schedule_value: t.schedule_value,
      status: t.status,
      next_run: t.next_run,
    })),
  );

  let result: string | null = null;
  let error: string | null = null;

  // For group context mode, use the group's current session
  const sessions = deps.getSessions();
  const sessionId =
    task.context_mode === 'group' ? sessions[task.group_folder] : undefined;

  // After the task produces a result, close the container promptly.
  // Tasks are single-turn — no need to wait IDLE_TIMEOUT (30 min) for the
  // query loop to time out. A short delay handles any final MCP calls.
  const TASK_CLOSE_DELAY_MS = 10000;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  // Accumulator for streaming assistant_text events. New agent-runner
  // protocol (2026-05-10) emits each text block as
  // event_type='assistant_text' with terminal=false, and the SDK's
  // terminal sdk_result carries result=null. Without this accumulator,
  // scheduled tasks lose every text block — confirmed regression cause
  // for Sentinel + Mailman silence after 5/11. See incident 2026-05-13.
  let accumulatedAssistantText = '';

  const scheduleClose = () => {
    if (closeTimer) return; // already scheduled
    closeTimer = setTimeout(() => {
      logger.debug({ taskId: task.id }, 'Closing task container after result');
      deps.queue.closeStdin(task.chat_jid);
    }, TASK_CLOSE_DELAY_MS);
  };

  try {
    const output = await runContainerAgent(
      group,
      {
        prompt: task.prompt,
        sessionId,
        groupFolder: task.group_folder,
        chatJid: task.chat_jid,
        isMain,
        isScheduledTask: true,
        taskId: task.id,
        assistantName: ASSISTANT_NAME,
      },
      (proc, containerName) =>
        deps.onProcess(task.chat_jid, proc, containerName, task.group_folder),
      async (streamedOutput: ContainerOutput) => {
        const terminalOutput = isTerminalContainerOutput(streamedOutput);
        // Append streaming text. The new agent-runner emits each
        // assistant text block as event_type='assistant_text' with
        // terminal=false, intending the host to forward it. For
        // scheduled tasks we accumulate and post once on terminal
        // (preserves the "one summary per daily task" UX).
        if (
          streamedOutput.event_type === 'assistant_text' &&
          streamedOutput.result
        ) {
          accumulatedAssistantText += streamedOutput.result;
        }
        // Compute the effective post-able result. Prefer the streaming
        // event's own result (backward compat with the old single-result
        // protocol). Fall back to the streaming accumulator (the new
        // protocol's only carrier of text — sdk_result.result is null).
        const effectiveResult = terminalOutput
          ? streamedOutput.result || accumulatedAssistantText
          : null;
        if (terminalOutput && effectiveResult) {
          result = effectiveResult;
          // Silent tasks (nightly reflections, L6 aggregation, etc.) run on
          // a schedule but must NOT post their result to chat. The task does
          // its state work (writes files, commits) and the result is captured
          // in task_run_logs for debugging, but chat stays quiet. This is the
          // runtime enforcement — agents cannot opt out by following prompts.
          if (task.silent) {
            logger.debug(
              { taskId: task.id },
              'Silent task — result captured in logs, not forwarded to chat',
            );
          } else {
            await deps.sendMessage(task.chat_jid, effectiveResult);
          }
          scheduleClose();
        } else if (
          streamedOutput.result &&
          streamedOutput.event_type !== 'assistant_text'
        ) {
          logger.debug(
            { taskId: task.id, eventType: streamedOutput.event_type },
            'Ignoring non-terminal scheduled task output',
          );
        }
        if (streamedOutput.status === 'success' && terminalOutput) {
          deps.queue.notifyIdle(task.chat_jid);
          scheduleClose(); // Close promptly even when result is null (e.g. IPC-only tasks)
        }
        if (streamedOutput.status === 'error') {
          error = streamedOutput.error || 'Unknown error';
        }
      },
    );

    if (closeTimer) clearTimeout(closeTimer);

    if (output.status === 'error') {
      error = output.error || 'Unknown error';
    } else if (output.result && isTerminalContainerOutput(output)) {
      // Result was already forwarded to the user via the streaming callback above
      result = output.result;
    }

    logger.info(
      { taskId: task.id, durationMs: Date.now() - startTime },
      'Task completed',
    );
  } catch (err) {
    if (closeTimer) clearTimeout(closeTimer);
    error = err instanceof Error ? err.message : String(err);
    logger.error({ taskId: task.id, error }, 'Task failed');
  }

  const durationMs = Date.now() - startTime;

  logTaskRun({
    task_id: task.id,
    run_at: new Date().toISOString(),
    duration_ms: durationMs,
    status: error ? 'error' : 'success',
    result,
    error,
  });

  const nextRun = computeNextRun(task);
  const resultSummary = error
    ? `Error: ${error}`
    : result
      ? result.slice(0, 200)
      : 'Completed';
  updateTaskAfterRun(task.id, nextRun, resultSummary);

  // Chain callback: wake the dispatching group when a child task finishes
  if (task.source_group) {
    // Extract PR URL from IPC result files (if any)
    let prUrlLine = '';
    try {
      const ipcStateDir = path.join(
        DATA_DIR,
        'groups',
        task.group_folder,
        'state',
      );
      const prFiles = fs
        .readdirSync(ipcStateDir)
        .filter((f: string) => f.startsWith('git-pr-') && f.endsWith('.json'))
        .sort()
        .reverse();
      for (const f of prFiles) {
        const data = JSON.parse(
          fs.readFileSync(path.join(ipcStateDir, f), 'utf-8'),
        );
        if (data.prUrl) {
          prUrlLine = `- PR URL: ${data.prUrl}`;
          break;
        }
      }
    } catch {
      /* no IPC state files — normal for non-PR tasks */
    }

    const groups = deps.registeredGroups();
    const sourceEntry = Object.entries(groups).find(
      ([, g]) => g.folder === task.source_group,
    );

    if (sourceEntry) {
      const [sourceJid] = sourceEntry;
      const callbackId = `callback-${task.id}-${Date.now()}`;
      const callbackStatus = error ? 'FAILED' : 'SUCCESS';
      const callbackPrompt =
        task.callback_prompt ||
        [
          `Chain task completed. Process this callback:`,
          ``,
          `- Completed task ID: ${task.id}`,
          `- Agent: ${task.group_folder}`,
          `- Status: ${callbackStatus}`,
          `- Result: ${resultSummary}`,
          ...(prUrlLine ? [prUrlLine] : []),
          ``,
          `Read the agent's output at /workspace/extra/groups/${task.group_folder}/state/`,
          `Advance the chain per your CLAUDE.md workflow.`,
        ].join('\n');

      createTask({
        id: callbackId,
        group_folder: task.source_group,
        chat_jid: sourceJid,
        prompt: callbackPrompt,
        schedule_type: 'once',
        schedule_value: new Date().toISOString(),
        context_mode: 'isolated',
        next_run: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        source_group: null, // callbacks don't chain further (prevents loops)
      });

      logger.info(
        { taskId: task.id, callbackId, sourceGroup: task.source_group },
        'Chain callback task created',
      );
    } else {
      logger.warn(
        { taskId: task.id, sourceGroup: task.source_group },
        'Source group not found for chain callback',
      );
    }
  }
}

let schedulerRunning = false;

export function startSchedulerLoop(deps: SchedulerDependencies): void {
  if (schedulerRunning) {
    logger.debug('Scheduler loop already running, skipping duplicate start');
    return;
  }
  schedulerRunning = true;
  logger.info('Scheduler loop started');

  const loop = async () => {
    try {
      const dueTasks = getDueTasks();
      if (dueTasks.length > 0) {
        logger.info({ count: dueTasks.length }, 'Found due tasks');
      }

      for (const task of dueTasks) {
        // Re-check task status in case it was paused/cancelled
        const currentTask = getTaskById(task.id);
        if (!currentTask || currentTask.status !== 'active') {
          continue;
        }

        deps.queue.enqueueTask(currentTask.chat_jid, currentTask.id, () =>
          runTask(currentTask, deps),
        );
      }
    } catch (err) {
      logger.error({ err }, 'Error in scheduler loop');
    }

    setTimeout(loop, SCHEDULER_POLL_INTERVAL);
  };

  loop();
}

/** @internal - for tests only. */
export function _resetSchedulerLoopForTests(): void {
  schedulerRunning = false;
}
