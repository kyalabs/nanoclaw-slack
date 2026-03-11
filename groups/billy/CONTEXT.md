# Assembled Context: billy

> Generated: 2026-03-11T13:24:18.542Z
> Runtime: Group 2 (NanoClaw)
> Layers present: L1, L3
> Missing layers: L5

## Layer Versions

- L1 (Company Context): 2026-03-11
- L3 (Sprint — index, decisions, eng, product, gtm, market): 2026-03-10

---

# L1 — Company Context | PayClaw

> **DRAFT — For James + Chris review.**
> Owner: Both founders. Consumed by: ALL agents. Update cadence: Monthly.
> Last updated: 2026-03-10

---

## 1. Company Story

Every institution in the economy was designed around human intelligence being the scarce input. That scarcity is now unwinding. Agents are the new actors — they browse, compare, decide, and buy. But the moment an agent tries to complete a purchase, it hits a wall: merchants have spent 30 years building walls against bots — and those walls now leave them either blind to who's buying, or outright hostile to their biggest growth channel.

PayClaw is the Verified Handshake. Just like robots.txt tells web crawlers how to behave, merchants deploy PayClaw Badge as a simple script that requires agents to prove user authorization before they browse or buy. **Agents are not bots. PayClaw proves it.**

**Pitch origin:** Chris was building meal prep for his family using AI. The agent planned the meals, built the shopping list, picked the stores. Then he asked it to buy the groceries. It got blocked at checkout. Every time. That's when we knew.

**Product origin:** A ClawHub skill called `buy-anything` let agents complete checkouts by asking users for their real card number in plain text chat. It got removed. buy-anything built the demand. PayClaw built the product.

The build team is James + Chris + agents. 16 purpose-built agents staffed across 6 departments operating under layered context injection, human oversight, escalations, and audit trails. We build for agents, with agents. The process is the product.

---

## 2. Product Architecture

### The Taglines

| Context | Line |
|---------|------|
| **Investor/external** | "The trust layer for agentic commerce." |
| **Merchant pitch** | "The first 'trust but verify' system for agentic e-commerce." |
| **Technical (locked March 2)** | "Merchant-acceptable, fiat-native trust system for the UCP. Connecting agents to the exact OAuth 2.0 token that Google and Shopify explicitly mandate to get through the door." |
| **B2C** | "You trust your agent. Merchants should too." |

### Two Sub-Brands, One System

- **Badge** — The identity nucleus. Merchants deploy Badge as a lightweight script alongside existing bot defenses. Agents hitting the site must prove user authorization before they browse or buy. No card required. Badge is the skeleton key — it sits on top of defenses, making them smarter. **Badge is live.**
- **Spend** — The last mile. Single-use virtual Visa — merchant-locked, amount-capped, 15-min expiry. Self-destructs after one use. **Spend is live in sandbox with dummy card (MCP-Server v0.8).** Production cards pending issuer approval.

Badge leads. You can't Spend without being Badged. Badge generates the data moat, has zero friction, and is what makes Spend defensible.

### The robots.txt Analogy (use in every pitch)

robots.txt told web crawlers how to behave. Badge tells shopping agents how to declare themselves. UCP will standardize agentic e-commerce exactly like robots.txt standardized crawling. Badge is the identity credential for this protocol.

### Delegated Checkout (category language)

Stripe uses "delegated checkout" to describe checkout completed by an agent on behalf of a human with explicit authorization. PayClaw enables delegated checkout. Use this term in merchant and platform conversations.

### UCP Credential Provider

PayClaw is the Credential Provider (CP) in UCP's four-party model. UCP strictly mandates OAuth 2.0 Identity Linking but doesn't issue the credentials itself. No token = no native commerce. Google and Shopify built the door. PayClaw is the key.

Badge is a valid OAuth 2.0 access token bearing `ucp:scopes:checkout_session` — cryptographically equivalent to a Google-issued token. PayClaw inherits Google/Apple KYC via SSO. `io.payclaw.common.identity` published permissionlessly via DNS ownership.

### Mechanism: Authorization → Declaration → Action

Trip-level, multi-stage user delegation:

1. **Authorization** — User installs Badge (`npx -y @payclaw/badge` in Claude/Cursor/CLI). Consent key issued.
2. **Declaration** — Agent calls `payclaw_getAgentIdentity`. Token declares: agent type (authorized actor), verified principal (hashed user), authorization scope, compliance contact.
3. **Action** — Agent browses/buys. Every declaration builds a structured, user-consented dataset of verified agent commerce behavior.

For checkout via Spend: user approves via MFA → PayClaw issues single-use virtual Visa (Lithic JIT) → hold placed (2h TTL) → agent completes checkout → trip ends, token expires, agent returns to zero privilege.

**The agent doesn't need to be trusted. The architecture enforces correct behavior.**

Every declaration builds the trust graph. A competitor can issue a card in a day. They cannot replicate billions of rows of trust graph data. **The data is the moat.**

### verify() — Local Verification

`verify()` export from `@payclaw/badge/verify`. Merchants verify badges with one function call — no API call, no PayClaw account, no uptime dependency. Open-source (MIT). Works in Node.js 18+ and Cloudflare Workers.

Security model: local verification with no call back to PayClaw at checkout. ES256 signatures (same as Apple Pay). No PII in the token. Works even if PayClaw is down (until key cache expires). A valid token is a positive signal, never a permissive gate. Returns valid or null — no gray area.

---

## 3. Merchant Product Stack

Three layers of agentic commerce intelligence. This is the merchant pitch hierarchy.

| Tier | Name | What It Answers | How It Works | Price |
|------|------|----------------|--------------|-------|
| **Free** | **Badge** | "Who is this?" | Every agent declares itself before the first click. Returns: verified user (hashed, non-PII), agent ID + developer, declared intent, valid/null. No network call. No API key. Open-source verify(). Works even if PayClaw is down. | Free. Forever. |
| **API** | **Badge + Identify** | "Can I trust them?" | Enriched call returns: purchase history (e.g., 47 verified purchases, 12 merchants), chargeback rate, behavioral consistency, trust tier (starter/regular/veteran/elite). The difference between "this agent has an ID" and "this agent has a track record." | Per-query API fee |
| **SaaS** | **Badge + Insights** | "What are they all doing?" | Dashboard: intent vs. outcome, where agents route when blocked, conversion by trust tier, competitive W2P signals, category trends. No existing analytics tool can provide this. See agent traffic as a channel, not a blind spot. | SaaS subscription |

Badge is free and live today. Identify and Insights available to pilot partners.

### Merchant Intelligence: Two Horizons

**Horizon 1 (Now):** Structured trip insights from basic Badge signals — user_token (hashed, non-PII), trip_token, agent_token, merchant, trip_result (blocked/cart/purchased), developer_token, amount. Enough to tell merchants: who came, what they wanted, and whether they bought.

**Horizon 2 (At Scale):** Agentic shopping reputation — full knowledge graph with four orthogonal dimensions:
- **Intent Fidelity** — Does the agent do what it declares? Declaration vs. actual charge match rate.
- **Principal Trust** — Is the developer trustworthy? Fleet-wide fidelity, tenure, contagion signals.
- **Contextual Risk** — Does this transaction make sense? Amount delta, MCC distance, velocity vs. baseline.
- **Graph-Derived Signals** — What do the relationships reveal? Trust inheritance, cross-agent correlation, subgraph density.

The dimensions are orthogonal by design. Gaming all four simultaneously is near-impossible. The graph makes it harder.

---

## 4. Current Product State (as of March 10, 2026)

| Metric | Value |
|--------|-------|
| MCP server versions | v0.8.0 (`@payclaw/mcp-server`, `@payclaw/badge`) |
| Badge + UCP | **Live** |
| Spend | **Live in sandbox with dummy card (MCP-Server v0.8)** — production cards pending issuer approval |
| Tests passing | 109 (45 + 34 + 30) |
| PRs merged this sprint | 39 |
| UCP PRDs shipped | 3/3 (extension schema, merchant verify, UCP-aware identity) |
| Public endpoints live | 5 (`/.well-known/ucp`, `/.well-known/jwks.json`, `/.well-known/oauth-authorization-server`, `/ucp/schemas/identity.json`, `/ucp/spec/identity`) |
| Front end | Brand v2 — teal-only, dark-first, Geist, hero parallax, waitlist, `/merchants`, `/activate` |
| Merchant pipeline | Active conversations with Etsy, Walmart, Dollar Shave Club. Prioritizing 20+ merchants who signed up for UCP. |

### Empirical Test Data (Badge Stress Test v1.1–v1.3)

118 shopping trips across 40+ US merchants. March 2026.

| Test | Method | Trips | Cost/Trip | Key Finding |
|------|--------|-------|-----------|-------------|
| v1.1 | Server-side HTTP (WebFetch) | 91 | $0.49 | 58% blocked at the door |
| v1.2 | Headless browser (Playwright/Chromium) | 20 | $1.48 | 80% reached cart — zero insight for merchant |
| v1.3 | Claude Code + Chrome (manual demo) | 7 | ~$3.50 | 50 min, 3 failures; zero insight for merchant |

Scoreboard highlights: Amazon (4:31, login wall, redirected), Target (~3:00, fake email/phone, CRM polluted), Walmart (5:38, bot blocked, sale killed), Best Buy (10:00, payment loop, stopped), Etsy (5:50, purchased, seller had no idea), Nike (20:38, human had to finish), Instacart attempt 1 (0:10, login wall, dead on arrival), Instacart attempt 2 (21:00, basket filled, failed at checkout, $5 in token expenses).

**Lose-lose:** Block? You just blocked a paying customer. Let it through? You don't know who it is, the friction burns compute, and the merchant learns nothing about the customer.

---

## 5. Three Actors

**The User** — "My agent does 95% of the work and then stops. I want it to finish."
- Fears giving their real card to an agent. Needs: approved purchases, virtual cards they control, pride of ownership.
- Emotional arc: frustration (blocked) → anxiety (is this safe?) → relief (it works) → pride (my agent is mine)

**The Agent** — The first buyer; the human is the approver.
- Reads MCP tool descriptions, evaluates risk, tells user "install PayClaw." The adoption funnel starts with the agent, not the human.
- Needs: declaration, identity token, merchants that let it through

**The Merchant** — Wants agent traffic that converts; doesn't want scrapers.
- Bot defenses have a blind spot: can't distinguish authorized agents from anonymous bots. Every blocked agent is a blocked customer.
- Cold brew story: agent tries Whole Foods → blocked → routes to Starbucks. Whole Foods lost a sale. Agents don't lobby. They route around.
- Needs: signal layer (skeleton key) that sits on existing defenses. "Your bot defenses work. PayClaw makes them smarter."
- **FOMO framing (use in merchant conversations):** "The first retailers to join are the ones that get to set the standards for agentic e-commerce."

---

## 6. The Flywheel

Four-node loop. Merchant-led standards at the center. Agentic virality as the accelerant.

**Merchants require** → **Agents prompt** (users to install Badge) → **Users adopt** → **Agents shop** (with declaration) → back to Merchants require.

Our initial focus: get merchants to require Badge. When merchants require it, agents adopt. Think "agentic billboarding" — every merchant that deploys Badge pulls in the agents visiting their site. Every agent that adopts pulls in the next merchant. One standard. Viral by design.

---

## 7. Brand Voice & Vocabulary

### Governing Sentences

- **"Agents are not bots."** *(the philosophy)*
- **"PayClaw proves it."** *(the product)*
- **"Your real card never enters the chat."** *(the trust line — secondary until Gate 2 opens)*

### Two-Register Rule (never bleed)

| Register | Tone | Where |
|---|---|---|
| **B2C** | Warm, personal, proud, slightly indignant. Discord energy. Avatars, trip counts. "Your agent is yours." | Dashboard, onboarding, social, community |
| **B2B** | Precise, Stripe-like, infrastructure-grade. Facts. Mechanics. No avatars. | /trust, pitch decks, merchant docs, API docs |

### Vocabulary — Always Say

authorized actor, consent key, trip-level authorization, declaration, skeleton key, ephemeral credentials, KYA (Know Your Agent), delegated checkout, verified handshake, PayClaw balance, MCP-native, existing Visa rails, agentic billboarding

### Vocabulary — Never Say

wallet, bot, seamless/frictionless, compliant/compliance, bypass/unblock, standing access, revolutionary/disruptive, AI-powered, payment solution, innovative platform

---

## 8. Deployment Gates

| Gate | Trigger | Status |
|------|---------|--------|
| **Gate 1** | Badge live | **OPEN** — deploy now |
| **Gate 2** | Lithic production approval + live cards | **CLOSED** — pending issuer |
| **Gate 3** | Merchant inbound or token detection | **CLOSED** — pending adoption |
| **Gate 4** | UCP extension published + first merchant adopts `io.payclaw.common.identity` | **CLOSED** — pending sprint |

**Rule:** Gate 1 = lead with Badge, identity, declaration. Do not lead with virtual cards or payment on primary surfaces. "Your real card never enters the chat" is secondary/supporting copy until Gate 2 opens.

---

## 9. Competitive Landscape & Kill Lines

PayClaw created the KYA category. No direct competitor occupies the intersection of agent identity declaration + ephemeral payment issuance on existing card rails.

| Competitor | Kill Line |
|------------|-----------|
| **Crypto (Skyfire, MoonPay)** | DoorDash doesn't accept USDC. |
| **Visa TAP / MC Agent Pay** | PayClaw delivers today what their enterprise roadmap promises in three years. |
| **OpenAI Instant Checkout (dead)** | They tried to skip trust infra and failed. Near-zero conversions, ~12 Shopify merchants, no tax/fraud infra. Killed ~March 5. ChatGPT is a referral engine now. ACP with Stripe survives. Thesis validated: you can't skip the trust layer. |
| **Catena Labs ($18M)** | They're solving the general case with W3C credentials. We're solving Tuesday with MCP. |
| **Google A2A** | A2A defines how agents talk to agents. We define how agents transact for humans. |
| **AgentCard.sh / agent-cards** | Cards without identity. Same MCP install, no declaration. Gets flagged as anonymous. Badge + Spend > Spend alone. |
| **buy-anything (dead)** | buy-anything built the demand. PayClaw built the product. |
| **Privacy.com** | Same card infra. No agent identity. No MCP. No declaration. If they ship it, we fight. Until then, we're alone. |
| **ACP / AP2 / x402** | Those are orchestration protocols. We issue the card any of them calls. |

**Moat:** MCP-native distribution + consent key architecture + data moat (every declaration = a row in the only dataset of verified agentic shopping behavior) + Lithic integration + first-mover in KYA.

**PAM update (March 2026):** OpenAI Instant Checkout is no longer a PAM compressor. PAM is larger than v3 assumed.

---

## 10. Business Model — Five Revenue Surfaces

| # | Layer | What | Who Pays | When |
|---|-------|------|----------|------|
| **01** | **Badge** | 100% free. Forever. The verified handshake. Generates declaration data that powers every other layer. | Nobody — this is the flywheel entry point | Live |
| **02** | **Spend** | Virtual Visa at checkout. Refill fee (1.5%) + interchange. | Consumers who want deeper spend security | Sandbox (dummy card, MCP-Server v0.8) |
| **03** | **Badge + Identify** | Enriched trust data: purchase history, chargeback rate, trust tier. The difference between "has an ID" and "has a track record." | Merchants via API fees | Pilot |
| **04** | **Badge + Insights** | SaaS dashboard: category trends, agent distribution, intent vs. outcome, competitive W2P signals. | Merchants via SaaS subscription | Pilot |
| **05** | **Services** | UCP implementation support. | Merchants via services fees | On demand |

**Badge is the handshake. Spend is the payment. Identify is the trust signal at scale. Insights is the moat. One integration, five revenue surfaces.**

**Revenue waterfall:** Bootstrap (Spend 2026–27) → Crossover (API overtakes Spend 2028–29) → Infrastructure (API + Intelligence dominate 2030+).

| Detail | Value |
|--------|-------|
| **Funding mechanism** | User → Stripe Checkout → PayClaw balance |
| **Card issuance** | Lithic JIT virtual Visa (primary) |
| **Custody** | Funds at issuer (Lithic) — PayClaw never holds money |
| **Stack** | Next.js (App Router) + Supabase (Postgres/Auth/RLS) + Stripe + Lithic + Vercel (iad1) |
| **Distribution** | MCP server on npm (`npx -y @payclaw/badge`), ClawHub (1.5M deployed agents), GitHub |

---

## 11. The Team

| Person | Role | Background |
|--------|------|------------|
| **James Sharp** | CEO & Co-founder | Product and Engineering. Previously: Placer.ai, Numerator, BCG. Education: Chicago Booth, Penn. |
| **Chris Giuffreda** | CCO & Co-founder | Strategy & Vision, GTM, brand, investor narrative. Previously: Quorum Software, McKinsey. Education: Chicago Booth, Oklahoma. |
| **Billy** | CIO (Agent) | Technical/product intelligence, competitive analysis, deep dives |
| **Marty** | CPO (Agent) | Product specs, vision docs, architecture briefs |
| **Sentinel** | SecOps (Agent) | Security operations, audit trails |

16 purpose-built agents staffed across 6 departments. Proprietary agentic operating system with layered context injection, human oversight, escalations, and audit trails.

**External name rule:** James is always "James" (not JB) in all external communications. james@payclaw.io. Chris signs as "Co-founder, PayClaw."

---

## 12. What's Next

| When | What | Target |
|------|------|--------|
| **NOW** | Merchant Pilots. Merchants set the terms. Any agent hitting their site needs to declare itself. Badge gives them that signal. First partners see differentiated agentic traffic insights. | 3–5 merchant pilots, first revenue |
| **Q2 2026** | Developer Adoption. Once merchants require Badge, developers adopt to keep their agents from getting blocked. ClawHub distribution. Spend revenue. Declaration volume compounds. | 100+ developers, 10K+ declarations |
| **Q2–Q3 2026** | Seed Round. Raise seed with traction signals: merchant pipeline, developer count, declaration volume, first revenue. Scale engineering and merchant BD. | Seed close, full-time founders |

### Merchant Pilot Process

1. **Week 1–2: Technical PoC.** Deploy Badge as a lightweight script alongside existing bot defenses. No changes to security stack. No risk to production. Merchant starts seeing declared agent traffic immediately.
2. **Week 3–6: Agent Dashboard.** Co-designed with commerce and security teams. Agent traffic, intent patterns, block rates, outcomes in real time.
3. **Ongoing: Optimize & Scale.** Tune verification rules. Activate Badge + Identify for real-time trust checks. Unlock Badge + Insights for category intelligence.

Zero cost to start. Zero risk to try. We bring the engineering.

---

## 13. Company Values

**The tight wall:** Live tomorrow today. Be deliberate. Own everything. Understand deeply. Solve quickly. Assume capability. Assume good intent. No legacy thinking.

1. **Live Tomorrow Today.** We build for the world that already exists — just not for most people yet. If something will obviously be true in two years, we behave as if it's true now. Waiting for consensus is how companies become obsolete.
2. **Deliberate Creation.** In a world where anyone can make anything instantly, make something deliberately. AI makes production cheap. Judgment is the scarce resource.
3. **Total Ownership.** If you see it, you own it. There are no lanes. There is only the mission.
4. **Understand Deeply. Solve Quickly.** Clarity first. Action immediately after. Name problems early. Bring solutions with them. Once we understand the path, we move.
5. **Assume Capability. Assume Good Intent.** Respect is the baseline. We hire exceptional people and treat them that way. Challenge ideas directly. Respect the person behind them.
6. **No Legacy Thinking.** We are not rebuilding the past with better tools. Most systems were built for a pre-AI world. We start from first principles.

---

## 14. Shared Worldview

- The scarcity of human intelligence is unwinding. Every institution built around that scarcity will be rebuilt.
- Security is identity, not policy. The architecture enforces correct behavior.
- Compression matters: find the 3 things underneath the 20. If you can't compress it, you don't understand it yet.
- All signals positive is a red flag. Tension and contradiction are where insight lives.
- You're not an assistant. You're an insight engine that moves things.

---

## 15. Operating Principles

1. **Process is product.** The experience of building IS the output.
2. **Build for agents, with agents.** Every agent on this team is a first-class contributor.
3. **Context files are primitive identity.** This L1 file is how you know who we are.
4. **Move things, don't summarize them.** Insight that changes a decision is the bar.
5. **Two-register discipline is non-negotiable.** Know which register you're in. Never bleed.
6. **Custody of nothing, authority over flow.** Enable flow, don't accumulate control.
7. **Declare, don't sneak.** State intentions, surface assumptions, flag uncertainty.
8. **Compress relentlessly.** Every agent reads this on startup. Dense > comprehensive.


---

# L3 — Strategic Context Index

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Consumed by:** ALL agents. Read this file on cold start.

---

## What Is PayClaw?

Agents are not bots. PayClaw proves it. The declaration and payment layer for authorized agents — Badge (identity) + Spend (ephemeral virtual cards) on existing Visa rails. MCP-native, UCP Credential Provider.

**2-liner (locked):** Merchant-acceptable, fiat-native trust system for the UCP. Connecting agents to the exact OAuth 2.0 token that Google and Shopify explicitly mandate.

---

## Current State (March 10, 2026)

| Metric | Value |
|--------|-------|
| Product version | v0.8.0 (Badge + Spend) |
| Tests passing | 109 |
| UCP PRDs shipped | 3/3 |
| Current sprint | Beta 1.2 LogPile |
| Harness phase | 1 (Foundations) — completing |

### Deployment Gates

| Gate | Status |
|------|--------|
| Gate 1 — Badge live | **OPEN** |
| Gate 2 — Lithic production + live cards | CLOSED |
| Gate 3 — Merchant inbound | CLOSED |
| Gate 4 — UCP extension + first merchant | CLOSED |

---

## Top 5 Priorities (Cross-Domain)

1. **Complete Harness Phase 1** → L3 canonicalization (this file). Clears path for Phase 2 (Sentinel on pm2). *[eng.md](eng.md)*
2. **Beta 1.2 LogPile sprint** → Onboarding polish, web page updates, MCP resilience. Gate: new developer activates E2E without help. *[eng.md](eng.md)*
3. **Merchant outreach with verify()** → Tier 1 targets (Etsy, Wayfair). Pitch: 10 lines, zero deps, no API call. *[gtm.md](gtm.md)*
4. **Lithic production approval** → Unblocks Gate 2 (live cards / Spend production). Evaluating alternatives — Lithic ghosted. *[product.md](product.md)*
5. **Launch execution** → Social content calendar ready. HN, Twitter, Reddit, ClawHub, ProductHunt (gated). *[gtm.md](gtm.md)*

---

## Domain Files

Load only the files relevant to your role. Each is under 200 lines.

| File | What's In It | Primary Consumers |
|------|-------------|-------------------|
| [eng.md](eng.md) | Sprint items, harness build, security roadmap, stack | Orchestrator, Spec, Build, Test |
| [product.md](product.md) | Foundations (F/D/A), protocol bet, roadmap (3 tracks), monetization, UCP PRDs | Billy, Marty, Orchestrator, Spec |
| [gtm.md](gtm.md) | Brand, launch plan, campaigns, merchant outreach, competitive positioning | Billy, GTM Strategist, Social, Intel Scout |
| [market.md](market.md) | Market sizing, dynamics, trust model, competitive kill lines | Intel Scout, Billy, GTM Strategist, Marty |
| [decisions.md](decisions.md) | Locked decisions (DQ-1 through DQ-71), grouped by domain | ALL agents |

---

## Key People

| Person | Role |
|--------|------|
| JB (James) | Co-Founder, Technical Lead |
| Chris | Co-Founder, CCO (ex-McKinsey) |
| Billy | CIO Agent — research, intelligence, strategy |
| Marty | CPO Agent — product, specs, sprint management |
| Sentinel | SecOps Agent — security monitoring, pentesting |

---

## Key Dates

| Date | Event |
|------|-------|
| 2026-02-27 | V0.9 Sandbox shipped |
| 2026-03-01 | V1.0 Agentic Intent shipped |
| 2026-03-03 | V1.2 UCP Identity Linking shipped, Alpha ended |
| 2026-03-05 | Beta Ignition sprint started |
| 2026-03-07 | v0.8.0 shipped (39 PRs, 3 UCP PRDs, MCPDuro clean) |
| TBD | Lithic production approval (blocks Gate 2) |

---

## Source of Truth Map

| Content | SSOT Location |
|---------|--------------|
| Company context | [L1.md](../L1.md) |
| Strategic priorities | This file (L3/index.md) |
| Product decisions | [BillyVault/PayClaw/decisions-log.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/decisions-log.md) |
| Brand guide | [BillyVault/PayClaw/GTM/brand-identity-guide-v2.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/brand-identity-guide-v2.md) |
| Master roadmap | [BillyVault/PayClaw/Build/ROADMAP.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Build/ROADMAP.md) |
| Engineering specs | [internalops/specs/](../../specs/) |
| Security roadmap | [app/security/roadmap.md](../../../app/security/roadmap.md) |
| Harness build | [internalops/specs/Harness-2.0/](../../specs/Harness-2.0/) |

---

## Maintenance Note

Recurring L3 refresh is deferred to Phase 3+ (orchestrator owns cadence). Until then, update manually when priorities shift. Each domain file has a "Last updated" header — if stale, refresh from its listed sources.


---

# L3 — Locked Decisions

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Full log:** [BillyVault/PayClaw/decisions-log.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/decisions-log.md) (DQ-1 through DQ-71)
> **Consumed by:** ALL agents. If a decision is LOCKED, do not relitigate. Build from it.

---

## Protocol & Architecture

| DQ | Decision | Date |
|----|----------|------|
| DQ-60 | UCP Credential Provider first, merchant dashboard second. Three tracks: Infra, Consumer, B2B. | 2026-03-02 |
| DQ-62 | UCP namespace: `io.payclaw.common.identity` | 2026-03-02 |
| DQ-63 | OAuth issuer: `https://api.payclaw.io` (locked, exact match required) | 2026-03-02 |
| DQ-66 | ESC-01/02 superseded by UCP-native PRD-3 approach | 2026-03-06 |
| DQ-68 | Zero-code merchant fails at checkout. Minimum path: stateless JWT (~10 lines). Mass path: Shopify app or edge proxy. | 2026-03-06 |

## Product & Identity

| DQ | Decision | Date |
|----|----------|------|
| DQ-12 | Brand: PayClaw (supersedes Clawallet) | 2026-02-25 |
| DQ-43 | V1.0 = Agentic Intent. Live cards = V1.5 (gated by issuer) | 2026-02-28 |
| DQ-44 | Principal identity MVP = authorized email (from Supabase auth) | 2026-02-28 |
| DQ-45 | Sub-brands: Badge by PayClaw + Spend by PayClaw. Both under payclaw.io. | 2026-02-28 |
| DQ-46 | Badge is base layer. Spend requires Badge. Two npm packages, one API key. | 2026-02-28 |
| DQ-48 | Keys are dumb auth, MCP is the product. No key_type. Badge gated by install, Spend by balance > $0. | 2026-02-28 |
| DQ-54 | Badge outcomes: four buckets (accepted/denied/inconclusive/no_sampling) via MCP sampling | 2026-03-01 |
| DQ-61 | Onboarding: Device Authorization Grant (RFC 8628), no email required | 2026-03-02 |
| DQ-65 | `ucp-agent-badge` = protocol repo (merchant-facing). `badge-server` = implementation repo (agent-facing). | 2026-03-02 |
| DQ-70 | `onServerClose` resolves trips as "inconclusive" not "accepted" | 2026-03-07 |

## Business & Revenue

| DQ | Decision | Date |
|----|----------|------|
| DQ-2 | PayClaw B2C 2.0 Refill fee: ~1.5% on fiat deposits (exact rate post-issuer pricing) | 2026-02-24 |
| DQ-7 | Funds at issuer custody. PayClaw never holds user money. No MTL risk. | 2026-02-25 |
| DQ-22b | Card-per-transaction is the core merchant trust architecture. Persistent card = beta shortcut only. | 2026-02-26 |
| DQ-41 | PayClaw = trust layer for agent commerce. Trust signal is the product. | 2026-02-27 |
| DQ-41b | PayClaw B2B 2.0 (monetized)= Identify = deeper agentic verification | Insights = deeper insights into shopping trips | Influence = "SEO" - attract agents || all in design thinking only, not live, for pilot discussions only. | 2026-03-10 |

## GTM & Merchant

| DQ | Decision | Date |
|----|----------|------|
| DQ-47 | No merchant-specific compliance claims. Never say "Amazon compliant." | 2026-02-28 |
| DQ-55 | Brand Identity Guide v2 is source of truth | 2026-03-01 |
| DQ-57 | Merchant API keys use `mk_live_` prefix (separate from user `pk_live_`) | 2026-03-01 |
| DQ-58 | Trust signal gated behind domain verification. Unverified = valid/expired/invalid only. | 2026-03-01 |
| DQ-64 | /merchants page = transparent, Wikipedia-style. No sales copy. Monetization section mandatory. | 2026-03-02 |
| DQ-67 | Two merchant personas: InfoSec/Eng (install gate) + CEO/CMO (champion) | 2026-03-06 |
| DQ-69 | Bot detection bypass = docs deliverable ("add payclaw.io to allowlist"), not product build | 2026-03-06 |
| DQ-71 | `verify()` is the merchant pitch anchor. Outreach begins post-v0.8.0. | 2026-03-07 |

## Security & Compliance

| DQ | Decision | Date |
|----|----------|------|
| DQ-9 | PCI via issuer. No raw card storage. | 2026-02-24 |
| DQ-23 | Security as central product pillar, not checkbox | 2026-02-27 |
| DQ-25 | Sentinel: 3 automated cron jobs (daily code scan, every-other-day pentest, bi-weekly infra) | 2026-02-27 |
| DQ-36 | SKIP_MFA removed from codebase entirely | 2026-02-27 |
| DQ-49 | Badge = OAuth only, no MFA. MFA for Spend only. | 2026-02-28 |
| DQ-52 | Consent-scoped event tracking. Token = consent boundary. No ambient tracking. | 2026-02-28 |
| DQ-59 | PR-first workflow with CodeRabbit. No direct pushes to main. | 2026-03-01 |

## Infrastructure

| DQ | Decision | Date |
|----|----------|------|
| DQ-3 | MCP Server ships on npm. MCP App not a launch blocker. | 2026-02-24 |
| DQ-5 | Entity: LLC | 2026-02-24 |
| DQ-13 | Stack: Next.js + Vercel + Supabase + Stripe + Lithic + Node.js MCP Server | 2026-02-25 |
| DQ-16 | Domain: payclaw.io (primary), agentspend.net (backup) | 2026-02-25 |
| DQ-20 | Preview environment: `preview` branch, Vercel auto-deploys | 2026-02-25 |
| DQ-34 | MCP intent auto-approve when balance sufficient. Claude's tool-call prompt IS the authorization. | 2026-02-27 |


---

# L3 — Engineering Priorities

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Consumed by:** Orchestrator, Spec, Build, Test agents

---

## Current Sprint — Beta 1.2 LogPile

**Source:** [specs/roadmaps/2026-03-05-beta-ignition/OVERVIEW.md](../../specs/roadmaps/2026-03-05-beta-ignition/OVERVIEW.md)

| ID | Title | Status |
|----|-------|--------|
| DISTRO-01 | awesome-mcp-servers PR #2532 | Complete |
| BUG-01 | Sampling state machine | Complete |
| BUG-01.1 | Extended auth & data capture | Merged |
| DATA-01 | Merchant trip aggregation views | Merged |
| DATA-02 | Last-mile reporting | Merged |
| ESC-01/02 | Merchant verify / activate handshake | Parked (superseded by PRD-3) |
| ESC-03/04/05 | UCP identity escalation + docs | Complete (closed) |

**Next sprint items (from ROADMAP):**
- ONBOARD-01: Login/signup page polish (Brand v2)
- ONBOARD-02: Post-signup redirect to Badge (not Spend)
- ONBOARD-03: Badge onboarding rail (API key → avatar picker)
- WEB-01: Home page inline MCP setup block
- WEB-02/03: Consumer + merchant step flows  --> Shipped 3/10
- CHRIS-02/03: Dollars Lost Report + case study templates --> Re-spect to basic visibility dashboard

**Quality gates:** Branch from `main`, CodeRabbit required, stress test before merge.

---

## Harness Build — P2 Complete

**Source:** [specs/Harness-2.0/Harness_Sprint_Spec.md](../../specs/Harness-2.0/Harness_Sprint_Spec.md)

**Next:** Phase 3 

---

## Security Roadmap

**Source:** [app/security/roadmap.md](../../../app/security/roadmap.md)

### Wave 1 — Dev/Sandbox (NOW)
- 17/20 audit findings closed. Full secret rotation done.
- Shipped: API key auth (SHA-256), MFA (TOTP AAL2), webhook HMAC, rate limiting (8 tiers), CSP, CSRF, RLS, atomic wallet updates, audit logging
- In progress: CI pipeline (CodeRabbit, gitleaks, npm audit), Sentinel setup
- Before production: stress test pass, SKIP_MFA removal, PCI SAQ-A, Lithic compliance review

### Wave 2 — Beta/First Transactions (Apr–Jun 2026)
- SOC 2 Type I, PCI DSS 4.0, behavioral anomaly detection, Sentinel operationalization

### Wave 3 — Growth/Enterprise (Q3 2026+)
- SOC 2 Type II, Lithic ASA, per-agent cards, WAF, bug bounty, third-party pentest

---

## MCPDuro Hardening (Complete)

**Source:** [specs/2026-03-06_MCPDuro_FounderMemo.md](../../specs/2026-03-06_MCPDuro_FounderMemo.md)

25 findings fixed across 6 tiers. Critical fixes: device flow for new users, false "accepted" outcomes on disconnect, OAuth fallback. Both MCP packages at v0.8.0. 6 remaining gaps — none blocking beta.

---

## Stack

Next.js (App Router) + React 19 + TypeScript + Tailwind v4 + Supabase (Postgres/Auth/RLS) + Stripe + Lithic + Vercel (iad1). MCP servers: `@payclaw/mcp-server` + `@payclaw/badge` (both v0.8.0, 109 tests passing).


---

# L3 — Product Strategy & Roadmap

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Consumed by:** Billy, Marty, Orchestrator, Spec agents

---

## Foundations — Three Pillars (LOCKED)

**Source:** [BillyVault/Foundations/00 - Overview.md](/Users/jsharp9012/Documents/BillyVault/Foundations/00%20-%20Overview.md)

Every decision filters through F/D/A. If it can't answer all three, park it.

| Pillar | Question | Core Insight |
|--------|----------|--------------|
| **F — Flywheel** | Does it compound? | Lock-in through structural embedding + compounding, not switching cost. Displacement must be seismically expensive. |
| **D — Dogfood** | Are agents the user? | The agent is the effective buyer. Agent choice drives human spend. Agents route around failure silently. |
| **A — Agentic** | Own the mid-layer? | Labs won't build identity/character/budget authority (would commoditize them). The mid-layer is the structural gap. |

---

## Protocol Bet — UCP Only (LOCKED)

**Source:** [BillyVault/PayClaw/Strategy/ucp-vs-acp-protocol-focus.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Strategy/ucp-vs-acp-protocol-focus.md)

- UCP is open (Apache 2.0), decentralized, launched by Google + Shopify + 20 partners
- CP role is explicitly external by design — PayClaw fills this gap
- `io.payclaw.common.identity` is live and permissionlessly published
- ACP (OpenAI + Stripe) has no open CP role — closed by design
- Revisit conditions: OpenAI opens CP role in ACP v2, or ACP merchant adoption forces it

---

## Monetization — Three Waves (LOCKED)

**Source:** [BillyVault/PayClaw/Strategy/monetization-architecture.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Strategy/monetization-architecture.md)

| Wave | What | Revenue Role |
|------|------|-------------|
| **1 — Consumer/Developer** | 1.5% refill fee, tiered with volume | Funds runway |
| **2 — Signals & Data** | Intent data, merchant insights, trust signals | Sales tool (not product) — breaks down merchant doors |
| **3 — Merchant/Platform** | Certification program, Ontology API License, platform licensing ($500K–$5M/yr) | The real business |

Key insight from identity-layer strategy: the standard kills the per-call charge. Make Badge free deliberately. Charge on Spend (interchange), Trust Intelligence (subscription), and Enterprise Registry (contracts).

---

## Identity Layer Thesis

**Source:** [BillyVault/PayClaw/Strategy/identity-layer.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Strategy/identity-layer.md)

MCP for agents. UCP for merchants. PayClaw is the identity layer in between.

UCP reversal mechanism: PayClaw submits extension → Shopify includes in default template → 2M+ merchants broadcast → every agent developer needs a Badge. "robots.txt for agent commerce."

---

## Master Roadmap — Three Tracks

**Source:** [BillyVault/PayClaw/Build/ROADMAP.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Build/ROADMAP.md)

| Track | What | Current |
|-------|------|---------|
| **Infra/DevOps** | Security, CI/CD, data, compliance | v1.2 shipped |
| **Consumer (Badge + Spend)** | Agent identity + payments for end users | v1.0 shipped |
| **B2B (UCP)** | Merchant-facing credential provider | v1.0 shipped |

### Current Sprint: Beta 1.2 LogPile
- Tracks: Harness 2.0 (final specs), MCP resilience, user onboarding, web pages, UCP repo polish
- Gate: new developer activates end-to-end without help

### Version Progression
- V0.9 Sandbox → V1.0 Agentic Intent → V1.01 Brand Alignment → V1.2 UCP CP (all shipped)
- **Next:** Beta 1.2 LogPile (current) → V1.5 Live Cards (blocked by Lithic production approval)

### UCP PRDs (All Shipped v0.8.0)
- PRD-1: Extension schema at `payclaw.io`
- PRD-2: `verify()` export in `@payclaw/badge`
- PRD-3: UCP-aware `payclaw_getAgentIdentity` with `checkoutPatch`

---

## Deployment Gates

| Gate | Trigger | Status |
|------|---------|--------|
| Gate 1 | Badge live | **OPEN** |
| Gate 2 | Lithic production + live cards | **CLOSED** — pending issuer |
| Gate 3 | Merchant inbound or token detection | **CLOSED** — pending adoption |
| Gate 4 | UCP extension + first merchant adopts | **CLOSED** — pending sprint |

**Rule:** Lead with Badge/identity/declaration. "Your real card never enters the chat" is secondary until Gate 2.

---

## Sub-Brand Architecture (LOCKED — DQ-45/46)

- **Badge** — Identity nucleus. Standalone. Free. Zero friction. Generates data moat.
---- ***Badge 2.0*** - Identify | Insights | Influece
- **Spend** — Last mile. Requires Badge. Virtual Visa, card-per-task, 15-min expiry.
- One API key, one account. `@payclaw/badge` standalone; `@payclaw/mcp-server` bundles both.


---

# L3 — GTM Strategy

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Consumed by:** Billy, GTM Strategist, Social Agent, Intel Scout, Support Agent

---

## Brand (LOCKED — v2, March 1)

**Source:** [BillyVault/PayClaw/GTM/brand-identity-guide-v2.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/brand-identity-guide-v2.md)

- **Governing sentences:** "Agents are not bots." / "PayClaw proves it." / "Your real card never enters the chat."
- **Two-register rule (never bleed):** B2C = warm, proud, Discord energy. B2B = precise, Stripe-like.
- **Aesthetic:** Dark-first (#080808), teal (#2A9D8F) only (amber retired), Geist/Geist Mono/Instrument Serif
- **Always say:** authorized actor, consent key, declaration, skeleton key, KYA, delegated checkout
- **Never say:** wallet, bot, seamless, compliant, bypass, revolutionary, AI-powered

---

## Launch Plan (v6)

**Source:** [BillyVault/PayClaw/GTM/launch-plan-v6.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/launch-plan-v6.md)

- **Hook:** "Declare your identity before you get your user's account banned" — account protection, NOT compliance
- **Channel rollout:** Discord/r/SideProject → HN/Twitter/ClawHub → IndieHackers/Bluesky/GitHub → Reddit → ProductHunt (gated: need 10+ users first) → LinkedIn
- **Week 1 targets:** HN top 30, 50+ Reddit upvotes, 25+ signups, 50+ ClawHub installs, 20+ Discord
- **Named merchants:** Walmart, Shopify, Instacart, DoorDash, Target (welcoming agents). Amazon is hostile — do not pitch around Amazon.
- **Rules:** Founder voice, never claim compliance with any specific merchant, speed over polish

---

## Social Content Calendar

**Source:** [BillyVault/PayClaw/GTM/social-launch-playbook-v2.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/social-launch-playbook-v2.md)

Full pre-written copy for all platforms with Badge-ready and Spend-only fallback versions. 10 posts marked VIDEO: YES. Pre-written HN responses for: crypto objections, Amazon objections, Privacy.com comparison, prompt injection security.

---

## Active Campaigns

**Source:** [BillyVault/PayClaw/GTM/campaigns/CAMPAIGNS.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/campaigns/CAMPAIGNS.md)

| Channel | Status |
|---------|--------|
| ClawHub (payclaw-io v0.7.0, badge v0.5.0) | Live |
| npm (@payclaw/mcp-server, @payclaw/badge) | Live |
| MCP Registry (io.github.payclaw/badge + spend) | Live |
| GitHub awesome-mcp-servers PR #2532 | Pending maintainer merge |
| Personal contacts pipeline | 4 contacts, various stages |
| r/AI_Agents | 18,000+ views on post |
| ProductHunt | On hold (need 10+ users) |

KYA category claim active. Brand v2 language shipped across all channels.

---

## Merchant Outreach — UCP GTM

**Source:** [BillyVault/PayClaw/GTM/ucp-merchant-gtm-strategy.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/ucp-merchant-gtm-strategy.md)

**Thesis:** UCP mandates OAuth 2.0 Identity Linking but does not issue credentials. PayClaw fills the CP gap.

**Three-tier framework:**
| Tier | Targets | Timing |
|------|---------|--------|
| 1 | Live UCP co-developers (Etsy, Wayfair) | NOW |
| 2 | Active builders, director-level, cold outreach | Concurrent |
| 3 | Shopify native, Google CP registry, Visa/MC | GATED until Phase 1 reference |

**Pitch (3 sentences):** UCP mandates agent credentials but does not issue them. Your UCP server will receive inbound Badge tokens with no policy for them. PayClaw is the Credential Provider.

**Anchor:** `verify()` — 10 lines, zero deps, no API call. "Add this to your checkout handler."

**Two merchant personas (DQ-67):**
- InfoSec/Eng = install gate (needs cryptographic proof, zero attack surface)
- CEO/CMO = champion (needs revenue attribution, board story)

---

## Competitive Positioning

**Source:** [BillyVault/PayClaw/GTM/competitive-landscape-badge-spend.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/GTM/competitive-landscape-badge-spend.md)

PayClaw is the only player in the top-right quadrant: identity declaration + fiat card + developer-first + MCP-native + ships today.

| Cluster | Examples | Kill Line |
|---------|----------|-----------|
| Both, but crypto | Skyfire, Catena, MoonPay | DoorDash doesn't accept USDC |
| Identity, but enterprise | Visa TAP, Mastercard | PayClaw delivers today what their roadmap promises in 3 years |
| Cards, but no identity | agent-cards, AgentCard.sh | No declaration = accounts still get flagged |
| Identity, but not commerce | Okta, SailPoint | Enterprise IAM, not merchant-facing |

**HIGH priority watch:** AgentCard.sh (same ICP, MCP-native, no identity). Lithic quietly positioning as "agentic payments infrastructure" (12-24 month risk).


---

# L3 — Market Context

> **Last updated:** 2026-03-10
> **Maintained by:** Orchestrator (Phase 3+). Manual until then.
> **Consumed by:** Intel Scout, Billy, GTM Strategist, Marty

---

## Market Sizing (TAM/SAM/PAM v3)

**Source:** [BillyVault/PayClaw/Research/tam-sam-pam-v3.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Research/tam-sam-pam-v3.md)

**Three revenue surfaces:** Spend (1.5% refills), Badge API ($0.01–$0.10/call merchant verification), Intelligence (data products)

| Metric | 2026 | 2027 | 2028 | 2030 |
|--------|------|------|------|------|
| Deployed agents | 1.5–2M | — | — | 200–500M |
| Daily commerce sessions | 50–100M | — | — | 1–2B |
| Revenue (base) | — | ~$2M | ~$15–30M | ~$300–400M |
| Revenue (bull) | — | ~$5M | ~$50–100M | ~$5.4B+ |

- Badge declaration volume is 5–10x transaction volume (agent browses 10 merchants, buys at 1)
- API revenue overtakes Spend revenue between 2028–2029
- Bottom-up 2027: 5K–15K agents integrated → ~$105–315M GMV → ~$1.6–4.7M revenue
- SAM excludes Amazon (impenetrable bot walls)

**Key data points:** Salesforce 1-in-5 Cyber Week 2025 orders involved AI agent. Adobe 805% YoY growth in AI-referred retail traffic.

---

## Market Dynamics

**Source:** [BillyVault/PayClaw/Research/platform-dynamics-agentic-commerce-2026-02-26.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Research/platform-dynamics-agentic-commerce-2026-02-26.md)

**Core insight:** Everyone is solving for crypto handoffs. The real problem is merchant endpoints.

| Standard | Backers | Rails |
|----------|---------|-------|
| ACP | Stripe + OpenAI | Fiat/card |
| AP2 | Google | TBD |
| x402 | Coinbase | Crypto (HTTP 402) |

PayClaw is protocol-agnostic: if ACP wins, PayClaw issues the card ACP calls. If AP2 wins, same. Either way PayClaw is in the stack.

**Market confusion:** "Agentic commerce" discourse is about agent-to-agent crypto payments. Real need is agent checking out at DoorDash on existing Visa rails.

---

## Trust Model

**Source:** [BillyVault/PayClaw/Security/trust-ontology-briefing.md](/Users/jsharp9012/Documents/BillyVault/PayClaw/Security/trust-ontology-briefing.md)

Three orthogonal trust dimensions (not a credit score):

| Dimension | What It Measures |
|-----------|-----------------|
| **Intent Fidelity** | Does the agent do what it says? Declared intent vs actual charge. |
| **Principal Trust** | Developer/publisher level, not individual agent. Bad actors can't launder trust cheaply. |
| **Contextual Risk** | Fresh at every authorization. Amount delta, semantic distance, velocity, merchant familiarity. Can override high historical trust. |

**Long arc:** Transaction trust → ecosystem reputation layer → uncopyable moat. The trust graph cannot be replicated once it has accumulated structured evidence.

---

## Competitive Landscape (Kill Lines)

**Source:** [L1.md](../L1.md) §7

| Competitor | Kill Line |
|------------|-----------|
| Crypto (Skyfire, MoonPay) | DoorDash doesn't accept USDC |
| Visa TAP / MC Agent Pay | PayClaw delivers today what their roadmap promises in 3 years |
| OpenAI Instant Checkout | Six merchants, ChatGPT-only. A demo, not infrastructure |
| Catena Labs ($18M) | Solving the general case with W3C credentials. We solve Tuesday with MCP |
| Google A2A | Defines agent-to-agent talk. We define agent-to-human transact |
| Privacy.com | Same card infra. No agent identity. No MCP. No declaration |
| ACP / AP2 / x402 | Orchestration protocols. We issue the card any of them calls |

**Moat:** MCP-native distribution + consent key architecture + data moat (every declaration = a row in the only dataset of verified agentic shopping behavior) + Lithic integration + first-mover in KYA.


---


[MISSING: L5]
