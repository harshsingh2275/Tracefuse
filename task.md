# task.md — TRACEFUSE
## Financial Crime Investigation Cockpit
### Build Bank Hackathon — Youth Economy Lab (YEL), IGDTUW Chapter
### Track 2: Fraud Detection & Financial Crime Prevention — Problem Statement 5: "Tracing Financial Crime Across Patterns"

---

## 1. PROJECT OVERVIEW

**Project name:** TraceFuse

**Tagline:** "Don't just detect suspicious transactions. Reconstruct the hidden story connecting them."

**Hackathon track:** Track 2 — Fraud Detection & Financial Crime Prevention

**Problem statement:** #5, "Tracing Financial Crime Across Patterns" — catch financial crime that only becomes visible across many transactions or accounts over time, where fraud is deliberately spread across many small transfers and accounts to avoid detection.

**One-paragraph product overview:**
TraceFuse is a financial crime investigation cockpit that models an entire financial ecosystem — accounts, people, devices, merchants, beneficiaries, and every transaction between them — as a live, explorable graph. Instead of scoring one transaction at a time, TraceFuse looks for structure across many transactions and accounts: money fanning out from one source, money laundering through a chain of intermediaries, circular flows designed to look legitimate, and mule networks that share devices. Every suspicious finding is deterministic, explainable, and traceable back to specific transactions — with an AI assistant layered on top that answers investigator questions grounded strictly in that evidence.

**Core value proposition:** Turns "this transaction looks slightly odd" into "here is the entire criminal network, the money trail, the timeline, and the evidence" — the actual bottleneck human analysts face, which single-transaction fraud scoring does not solve.

**Target user:** Financial crime investigators and fraud/risk operations teams at banks, NBFCs, and fintechs.

**Primary use case:** An investigator receives (or the system auto-generates) a suspicious case, opens the investigation cockpit, explores the network graph and timeline, uses "Follow the Money" to trace fund flow across hops, reviews the explainable risk score and evidence, asks the AI assistant clarifying questions, and takes action (escalate/resolve) — ending with a generated report.

**Why this is different from generic fraud detection:** Most hackathon fraud projects are single-transaction binary classifiers ("fraud / not fraud") with a black-box score. TraceFuse's differentiator is explicitly NETWORK + TIME + PATTERN + EXPLAINABILITY + INVESTIGATION WORKFLOW — it behaves like an investigation tool, not a spam filter.

**What will be demonstrated in the hackathon:** A pre-seeded synthetic dataset containing 9 distinct behavioral scenarios (benign + 7 fraud patterns + 1 complex multi-pattern case), a live dashboard showing detected suspicious cases, an interactive graph + timeline for the flagship case, a working "Follow the Money" multi-hop trace, an explainable composite risk score, a grounded AI assistant, case status workflow, and a generated investigation report — all reachable within 60 seconds via a "Load Demo Investigation" button.

---

## 2. USER PERSONAS

### A. Financial Crime Investigator / Analyst
- **Goals:** Quickly understand why a case was flagged, trace money movement, gather evidence, decide whether to escalate.
- **Pain points:** Fraud is spread across many small transactions/accounts; manual tracing is slow; single-transaction alerts lack context.
- **Actions:** Opens cases, explores graphs, filters by time/entity, runs Follow the Money, asks the AI assistant, writes notes, changes case status.
- **Information needed:** Entity relationships, transaction timeline, pattern detections, risk breakdown, prior account behavior.
- **Features used:** Investigation graph, timeline, Follow the Money, evidence panel, AI assistant, case notes.

### B. Fraud/Risk Operations Manager
- **Goals:** Prioritize investigator workload, monitor overall exposure, ensure cases are resolved.
- **Pain points:** No aggregate visibility into how many networks are active, which are most severe, how much money is at risk.
- **Actions:** Reviews dashboard metrics, reassigns/escalates cases, monitors resolution rates.
- **Information needed:** Case counts by severity, total flagged amount, escalation queue, trend charts.
- **Features used:** Dashboard summary, case list with filters, escalation queue.

### C. Executive Overview Persona (optional, P2)
- **Goals:** High-level confidence that fraud is being caught and quantified.
- **Pain points:** No simple way to see impact without digging into case detail.
- **Actions:** Views summary metrics only.
- **Information needed:** Total amount protected, number of networks disrupted, top pattern types.
- **Features used:** Dashboard top-level metrics only.

---

## 3. CORE USER JOURNEY

1. **Demo entry** — Landing page with a functionally gated login screen (use a simple, hardcoded password like 'demo2026' for judges). Unauthenticated users must be strictly blocked from accessing the dashboard by manually tampering with the URL.
2. **Overview dashboard** — Shows top-level metrics (suspicious networks, high-risk accounts, flagged transactions, amount under investigation) and a list of suspicious cases sorted by risk score.
3. **Suspicious cases** — List/table view; each row shows case title, entities involved, pattern types, risk score/level, status.
4. **Investigation selection** — Investigator clicks a case (default: the flagship "complex multi-pattern network" scenario) to open the Investigation Case View.
5. **Graph exploration** — Interactive node-link graph of the case's entities; click nodes to inspect, filter by entity/time/type, isolate suspicious clusters.
6. **Pattern detection** — A panel lists all detected patterns (fan-out, layering, circular flow, etc.) each with a plain-language explanation and linked evidence.
7. **Timeline analysis** — A horizontal timeline shows every transaction in sequence, highlighting bursts and rapid pass-throughs.
8. **Follow the money** — Investigator selects a source transaction/account; system traces multi-hop fund flow and renders it as a hop-by-hop path with amounts and timestamps.
9. **Evidence review** — A structured evidence list ties every risk factor to specific transaction IDs/timestamps/amounts.
10. **AI explanation** — Investigator types or clicks a suggested question ("Why is Account X suspicious?"); AI answers using only the case's structured data.
11. **Recommended action** — System suggests an action (e.g., "Escalate — Critical") based on risk band.
12. **Case status** — Investigator changes status: New → Investigating → Escalated → Resolved.
13. **Investigation report** — Investigator generates/exports a report summarizing the case for compliance/handoff.

---

## 4. FEATURE PRIORITIZATION

### P0 (MVP — must work for the demo)
| Feature | Purpose | Interaction | Output | Implementation notes | Demo importance |
|---|---|---|---|---|---|
| Synthetic dataset (9 scenarios) | Ground truth for every other feature | N/A (seed script) | Seeded DB | Deterministic seed, Section 9 | Critical — nothing works without it |
| Dashboard summary | Orient the judge instantly | View | Metrics + case list | Aggregate queries | Critical |
| Detection engine (8 detectors) | Core technical differentiator | Runs at seed/ingest time | Structured pattern objects | Section 11/12 | Critical |
| Explainable risk engine | Turns patterns into a score + reasons | View | Score + factor breakdown | Section 14 | Critical |
| Investigation graph (React Flow) | Visual "wow" | Click/zoom/pan/filter | Rendered graph | Section 5A | Critical |
| Timeline view | Shows temporal structure | Scroll/zoom | Rendered timeline | Section 5C | Critical |
| Follow the Money | Flagship interaction | Select + trace | Hop-by-hop path | Section 5D | Critical |
| Case view + status workflow | Investigator workflow | Click/update | Updated case state | Section 7 | High |
| AI assistant (grounded) | Explainability/investigator copilot layer | Chat input | Grounded answer | Section 15 | Critical |
| Demo mode | Judge reaches wow in <60s | One click | Loaded flagship case | Section 21 | Critical |
| Investigation report | Converts investigation findings into a handoff artifact | Click "Generate Report" | Structured printable report | Section 22 | High |
### P1 (highly valuable, build after P0 is stable)
- Case notes
- Multiple simultaneous cases in dashboard (not just the flagship)
- Graph filters by time window and entity type

### P2 (optional polish)
- Executive overview persona view
- Animated graph transitions
- Dark/light theme toggle
- CSV export of evidence

---

## 5. FLAGSHIP FEATURES

### A. Dynamic Transaction Graph
**Node types:** `account`, `person`, `merchant`, `device`, `beneficiary`, `identifier` (phone/email/UPI ID).
**Edge types:** `transaction` (account→account, weighted by amount, labeled with timestamp), `owns` (person→account), `uses` (account→device), `linked_to` (identifier shared between accounts), `receives`/`transfers_to` (directional money flow).

**Graph presentation rules:**

- The default investigation view must show only entities and relationships relevant to the selected investigation.
- Do not render the entire synthetic dataset in a single graph.
- Prioritize the primary suspicious path/network in the initial viewport.
- Secondary relationships should be expandable on demand.
- The graph should automatically fit the primary investigation network into the viewport.
- Unrelated entities must remain hidden or heavily de-emphasized by default.
- For dense networks, provide a "Focus on Suspicious Cluster" action that removes unrelated nodes from the active view.
- The graph should visually emphasize:
  1. originating/source entities,
  2. intermediary entities,
  3. final beneficiary entities,
  4. shared infrastructure such as devices,
  5. detected suspicious relationships.
- The investigator must be able to reset to the full investigation view.

**Interactions required:**
- Zoom/pan (React Flow built-in controls)
- Click node → side drawer with entity details (account age, transaction count, connected devices, risk contribution)
- Highlight connected entities on hover/click (dim unrelated nodes)
- Filter by transaction type / time range (slider) / entity type (checkboxes)
- "Isolate suspicious cluster" button — hides all nodes/edges not part of the flagged pattern
- Click edge → transaction details popover (amount, timestamp, transaction ID)
- Visual distinction: shape or icon per node type; color/border by risk severity (not color alone — also badge icon and border thickness) per Section 10.

**Data model for the graph:** Built server-side from `Entity`, `Account`, `Transaction`, `Device` tables into a `{nodes: [], edges: []}` JSON payload scoped to one investigation, returned by `GET /investigations/:id/graph`.

### B. Pattern Detection Engine
Each detector is a pure function: `(transactions, accounts, devices) -> PatternResult[]`. All thresholds are config values in `analytics/patterns/config.py` (or `.ts` equivalent), never hardcoded inline.

| Pattern | Detection logic | Required data | Default threshold | Explanation shown | Risk contribution |
|---|---|---|---|---|---|
| Fan-out | One source account sends to N≥5 distinct destination accounts within a rolling window W (default 30 min) | Transactions grouped by source, time | N≥5, W=30min | "Account sent money to {N} different accounts within {W} minutes" | High |
| Fan-in | N≥5 distinct source accounts send to one destination within W | Same as above, grouped by destination | N≥5, W=30min | "Account received funds from {N} different accounts within {W} minutes" | Medium-High |
| Rapid pass-through | Account receives amount X and forwards ≥P% of X onward within T minutes | Transaction pairs per account | P=80%, T=10min | "{P}% of received funds ({amount}) forwarded onward within {T} minutes of receipt" | High |
| Transaction splitting/fragmentation | A single logical transfer amount is split into K≥4 smaller transactions to the same destination within W | Transaction amounts, destination grouping | K≥4, W=15min | "Multiple transfers totaling ~{total} were sent to the same destination through {K} smaller transactions within {W} minutes, indicating a potential fragmentation pattern." | Medium |
| Suspicious velocity | Account's transaction count in window W exceeds its trailing historical average by factor F | Rolling counts per account | F=5x, W=1hr | "Transaction velocity is {F}x this account's normal rate" | Medium |
| Circular movement | Directed cycle detected in the transaction graph (A→B→C→A) within time window W | Graph cycle detection (DFS) | W=24hr, cycle length ≤6 | "Funds returned to the originating account after passing through {N} intermediaries" | Critical |
| Shared-device relationship | ≥2 accounts share the same device ID | Device table joins | ≥2 accounts/device | "{N} accounts are linked to the same device, suggesting common control" | High |
| Newly introduced intermediary | Account created within D days of hackathon dataset's synthetic "now", with no prior transaction history before this case | Account creation timestamp | D=7 days | "Account was created {D} days before this activity, with no prior transaction history" | Medium |

Each detector returns:
```json
{
  "pattern_type": "fan_out",
  "severity": "high",
  "confidence": 0.9,
  "entities": ["acc_1042"],
  "transaction_ids": ["txn_501","txn_502","..."],
  "evidence": "Account acc_1042 sent money to 7 distinct accounts within 22 minutes.",
  "explanation": "..."
}
```

### C. Temporal Analysis
- Timestamp ordering of every transaction in a case.
- Rolling windows for velocity (per-account transaction count in trailing N minutes).
- Time-between-incoming-and-outgoing computed per account (used by rapid-pass-through detector).
- Burst detection: flag windows where transaction count is a statistical outlier vs. the account's trailing baseline.
- Timeline visualization: horizontal scrollable timeline (one row per key account or per pattern), transactions plotted as points sized by amount, colored by direction (in/out), with burst windows shaded.

### D. Follow the Money
Investigator selects a starting transaction (or source account + destination account + approximate amount). Backend performs a bounded BFS/DFS over the transaction graph:
- **Inputs:** source account, optional destination account, optional min amount, max hops (default 6), time range (default: case time window).
- **Output:** ordered list of hops: `{hop_number, from, to, transaction_id, amount, timestamp, cumulative_amount, elapsed_time_from_start}`.
- **Constraint:** only follow edges where timestamp is strictly increasing and the outgoing amount can be plausibly attributed to funds previously received by that account during the trace window.
- **Fund provenance model:** use a simplified FIFO provenance model for the MVP. Incoming funds are placed into a traceable balance queue ordered by timestamp. Outgoing transactions consume the earliest available traceable funds first. If only part of an incoming amount is consumed, the remaining amount remains traceable for later outgoing transactions.
- The provenance model is an investigation heuristic, not a claim of exact real-world fund attribution.
- The UI must label this appropriately as "Traceable Fund Flow" rather than implying legally proven ownership of specific funds.
- **Rendering:** horizontal flow diagram, source → intermediary(ies) → beneficiary, animated left-to-right, with amount and time-elapsed labels on each hop.

### E. Explainable Investigation Risk Score
The system produces a composite Investigation Risk Score in [0,100], built from weighted, named sub-scores — never a single opaque number.

The Investigation Risk Score is a prioritization signal for investigators and MUST NOT be presented as:
- probability of fraud
- probability of money laundering
- legal determination of criminal activity
- statistical certainty

The UI should describe it as an "Investigation Risk Score" or "Investigation Priority Score".

**Categories and default weights:**
| Category | Weight |
|---|---|
| Velocity risk | 0.15 |
| Graph/network risk (degree, centrality) | 0.20 |
| Temporal risk (bursts, rapid pass-through) | 0.20 |
| Fragmentation risk | 0.15 |
| Circular flow risk | 0.15 |
| Entity reuse risk (shared device/identifier) | 0.15 |

Each category score is itself derived from the confidence/severity of the detectors that fed it (e.g., graph risk = max(degree-centrality-normalized-score, fan-out confidence × severity weight)). Final score = weighted sum, clamped to [0,100].

**Score bands:** 0–29 Low, 30–59 Medium, 60–79 High, 80–100 Critical.

**Output shown to user:**
```
Investigation Risk Score: 87/100 — Critical

Reasons:
- 14 counterparties within 20 minutes (velocity)
- 4 newly introduced intermediary accounts (entity reuse)
- 83% of received funds transferred onward within 5 minutes (temporal)
- Same device associated with 4 accounts (entity reuse)
- Circular movement detected across 3 hops (graph)
```
Guard rail: no single detector alone can push the score above 60 (Medium ceiling for one signal) — this prevents one heuristic from producing an extreme score, per product principle.

### F. Case Genesis — "Why Did TraceFuse Open This Case?"

Every investigation must have a concise, investigator-friendly explanation of why TraceFuse considers the activity worthy of investigation.

At the top of every Investigation Case View, display a "Case Genesis" panel containing:

- Primary trigger
- Triggering account/entity
- Triggering time window
- Number of suspicious transactions
- Number of connected entities
- Detected pattern types
- Total amount involved
- 3–5 strongest evidence signals

Example:

CASE GENESIS

TraceFuse opened this investigation because:

• Account acc_1042 sent funds to 8 distinct accounts within 21 minutes.
• 4 recipient accounts were connected to the same device fingerprint.
• 79% of received funds were transferred onward within 5 minutes.
• A circular flow returned funds to a related account.
• ₹8.4L moved through the network during the investigation window.

The Case Genesis panel must be generated from actual Pattern, RiskSignal, Evidence, Account, and Transaction data.

Do not hard-code the explanation.

Purpose:
Allow a judge or investigator to understand within 10 seconds why the system created this case before exploring the graph.

### G. AI Investigation Assistant
- **Grounding:** Every assistant query is answered using a structured JSON context payload built server-side from that specific investigation's actual data (patterns, evidence, graph summary, timeline summary, risk breakdown) — never from general knowledge.
- **Prompt structure:** System prompt instructs the model to answer ONLY from the provided context and to explicitly say "I don't have evidence for that" rather than speculate.
- **Example supported queries:** "Why is this account suspicious?", "Show me the strongest evidence.", "How did the money move?", "Which accounts are most central to this network?", "Why was this case escalated?", "What changed compared with this account's previous behavior?" Additional high-value investigator actions:

- "Summarize this case for escalation."
- "Give me the three strongest pieces of evidence."
- "Explain the money trail in plain language."
- "Which entities should an investigator examine first?"
- "What changed in this network immediately before the suspicious activity?"
- "Create a concise handoff summary for the next investigator."

For structured investigation requests, the response should use a consistent format where appropriate:

- Finding
- Evidence
- Relevant entities
- Relevant transactions
- Recommended investigation action

The assistant must distinguish between observed evidence and suggested investigative actions.

It must never claim that an entity is definitively criminal based solely on the prototype's score or heuristics.
- **Output:** Plain-language answer that cites specific transaction IDs/timestamps/amounts/pattern names from the context payload.
- **Fallback when no AI API key is configured:** Assistant panel displays: "AI assistant unavailable. Showing deterministic investigation evidence." followed by the raw evidence list (so the feature always has something to show even offline).

---

## 6. INVESTIGATION DASHBOARD

**Top-level metrics (cards):** Suspicious networks (count), high-risk accounts (count), flagged transactions (count), total amount under investigation (₹), active investigations (count), escalated cases (count).

**Main sections:**
- Suspicious cases table: columns = Case ID, Title, Pattern types (badges), Entities involved, Risk score/level, Status, Last updated. Sortable by risk score (default: descending).
- Network overview mini-graph (optional P1): small preview graph of the highest-risk case.
- Transaction volume chart: line chart of daily transaction volume across the synthetic dataset window (Recharts).
- Risk distribution: bar chart of case counts per risk band.
- Recent alerts: last 5 detector firings, timestamped.
- Investigation queue: cases with status New or Investigating.

**Layout:** Top metric cards in a 4–6 column responsive grid; below, a two-column layout (case table left/main, charts right sidebar) collapsing to single column on narrow viewports.

**States:**
- Empty: "No investigations yet — run the seed script or click Load Demo Investigation."
- Loading: skeleton cards/table rows.
- Error: toast + inline retry button; never a blank white screen.

---

## 7. INVESTIGATION CASE VIEW

Route: `/investigations/[id]`

**Header:** Case ID, case title, severity badge, status badge, risk score (large, with band color+icon).
**Body tabs/sections:** Overview (entities, total flow, time window) · Graph · Timeline · Evidence · Follow the Money · AI Assistant · Notes/History.

**Action buttons:** INVESTIGATE (sets status→Investigating), FOLLOW THE MONEY (opens trace panel), VIEW EVIDENCE (scrolls to evidence tab), ASK AI (opens assistant panel), ESCALATE, MARK RESOLVED, GENERATE REPORT.

---

## 8. DATA MODEL

```
User { id, name, role, email }

Account { id, account_number, holder_name, account_type, created_at, is_synthetic }

Entity { id, type[person|merchant|beneficiary], name, metadata_json }

Device { id, device_fingerprint, device_type, first_seen_at }

AccountDevice { account_id, device_id, linked_at }   -- join table

`AccountIdentifier` many-to-many `Account↔Identifier`, allowing the same phone/email/UPI identifier to be linked to multiple accounts and used as an investigation relationship.

Identifier { id, type[phone|email|upi_id], value }

AccountIdentifier { account_id, identifier_id, linked_at }

Transaction { id, source_account_id, destination_account_id, amount, currency,
              timestamp, transaction_type, upi_ref, is_synthetic }
  indexes: (source_account_id, timestamp), (destination_account_id, timestamp)

Investigation { id, title, status[new|investigating|escalated|resolved],
                risk_score, risk_level, created_at, updated_at, time_window_start,
                time_window_end, total_flow_amount, scenario_tag }

InvestigationEntity { investigation_id, account_id }   -- join table, entities in scope

Pattern { id, investigation_id, pattern_type, severity, confidence,
          transaction_ids_json, entities_json, explanation }

RiskSignal { id, investigation_id, category, score, weight, explanation }

Evidence { id, investigation_id, pattern_id (nullable), description,
           transaction_ids_json, created_at }

CaseNote { id, investigation_id, user_id, note_text, created_at }

CaseAction { id, investigation_id, user_id, action_type[status_change|escalate|resolve],
             previous_value, new_value, created_at }
```

Relationships: `Transaction.source_account_id/destination_account_id → Account.id`; `AccountDevice` many-to-many `Account↔Device`; `Investigation ↔ Account` many-to-many via `InvestigationEntity`; `Pattern`, `RiskSignal`, `Evidence`, `CaseNote`, `CaseAction` all belong to one `Investigation`.

---

## 9. SYNTHETIC DATASET

Generate with a deterministic seed (e.g., `random.seed(42)` / `faker.seed_instance(42)`) so the demo is reproducible. Use Indian-style identifiers: account numbers like `XXXX-XXXX-XXXX`, UPI IDs like `name@okhdfcbank`, INR amounts, realistic Indian merchant names, IST timestamps.

**Scenarios (each tagged via `Investigation.scenario_tag` or an internal `scenario` field on seed accounts):**
1. **Normal customers** — ~30 accounts with ordinary, sparse, benign transaction history (salary in, bill payments/groceries out).
2. **Normal high-frequency business account** — 1–2 merchant accounts with high daily volume but consistent, explainable patterns (no fan-out/fragmentation).
3. **Fan-out fraud network** — 1 source account sends to 8 destination accounts within 20 minutes.
4. **Layered money movement** — Funds pass through 4 sequential intermediary accounts before reaching a final beneficiary, each hop within minutes.
5. **Circular transaction network** — A→B→C→A cycle completing within a few hours.
6. **Shared-device mule network** — 4 accounts, all linked to the same 1–2 device fingerprints, transacting with each other.
7. **Rapid pass-through accounts** — Accounts that receive funds and forward ≥80% within 5 minutes, repeated across multiple receipts.
8. **Transaction fragmentation** — A ₹2,00,000 transfer split into 6 transactions of ~₹33,000 each to the same destination within 15 minutes.
9. **Complex multi-pattern network (flagship demo case)** — Combines fan-out + layering + shared device + circular flow into one coherent narrative: a large fraudulent credit enters one account, fans out to 5 intermediaries, 3 of which share a device, funds are layered through 2 more hops, and a portion cycles back to a related account — this is the primary "Load Demo Investigation" case.

Include enough benign volume (scenarios 1–2, at least 70% of total transactions) that fraud isn't obvious from raw volume alone — it must emerge from pattern detection.

**Generation instructions:** Provide a `data/seed/generate_seed_data.py` (or `.ts`) script that:
- Sets deterministic seed.
- Generates accounts/entities/devices per scenario.
- Generates transactions per scenario with realistic timestamps within a fixed synthetic date window (e.g., last 14 days).
- Writes directly to the configured database via the ORM, or emits `seed.json` consumed by a separate loader.
- Is idempotent (safe to re-run — clears and re-seeds, or checks a `is_synthetic` flag).

---

## 10. GRAPH MODEL

**Node types:** account, person, merchant, device, beneficiary, identifier — each with a distinct icon/shape in the UI (not color alone).
**Edge types:** transaction, owns, uses, linked_to, receives, transfers_to.

**Visual treatment by suspiciousness (multi-signal, not color-only):**
- Normal: neutral gray border, standard icon, thin edge line.
- Suspicious: amber border + warning badge icon + medium edge thickness.
- Critical: red border + alert badge icon + thick animated (dashed-pulse) edge line.

Edge thickness scales with transaction amount (log scale) independent of severity coloring, so both dimensions are visible simultaneously.

---

## 11. DETECTION ENGINE ARCHITECTURE

Pipeline (modular, each stage independently testable):

```
Transaction Processor
  → Feature Extraction (per-account rolling stats, degree, device links)
  → Pattern Detectors (Section 5B, run independently, produce PatternResult[])
  → Relationship Builder (constructs graph nodes/edges from raw + pattern data)
  → Risk Aggregator (Section 5E — combines PatternResults into RiskSignals + composite score)
  → Investigation Generator (groups connected suspicious entities into an Investigation record)
```

Every detector output conforms to the structured schema in Section 5B. This engine is fully deterministic and rule-based for the MVP; the architecture keeps detectors as pluggable modules behind a common interface (`detect(transactions, accounts, devices, config) -> PatternResult[]`) so an ML-based detector could later be added alongside the rule-based ones without redesigning the pipeline — it would simply implement the same interface and its outputs would flow into the same Risk Aggregator.

---

## 12. GRAPH ALGORITHMS

- **BFS/DFS** — money tracing (Follow the Money) and circular-movement (cycle) detection.
- **Connected components** — grouping which accounts/transactions belong to the same investigation.
- **Degree analysis** — fan-out/fan-in detection (out-degree/in-degree within time window).
- **Centrality (betweenness or degree centrality)** — identifying which account is most "central" to a network, surfaced in the AI assistant's "which accounts are most central" answers.
- **Cycle detection** — circular movement pattern.
- **Multi-hop neighborhood analysis** — bounding Follow the Money to N hops.

Community detection (e.g., Louvain) is explicitly **not required for MVP** — connected components is sufficient at this dataset scale and avoids overengineering; flag it as a P2/stretch idea only if time remains.

---

## 13. TEMPORAL ANALYTICS

- Rolling transaction count per account over trailing window (velocity).
- Inter-transaction time (gap between an account's consecutive transactions).
- Incoming/outgoing ratio per account per window (used for rapid-pass-through).
- Short-lived account flag: `created_at` within D days of first transaction in this case.
- Burst detection: window transaction count > (trailing mean + k·stddev).

These feed directly into the "Temporal risk" and "Velocity risk" categories of the Risk Engine (Section 5E).

---

## 14. RISK ENGINE

Score = Σ (category_score_i × weight_i), clamped [0,100]. Weights and thresholds live in one config file so judges (and future developers) can see exactly how the score is constructed — nothing is a black box. Score bands as in Section 5E. Guard rail: cap any single category's contribution at 60 points before weighting, so one strong signal cannot alone produce a Critical score without corroboration — multiple independent signals are required to reach 80+.

---

## 15. AI ARCHITECTURE

- **Model provider abstraction:** a single `AIProvider` interface (`generate(prompt, context) -> string`) with one concrete implementation (Groq API, OpenAI-SDK-compatible) so the provider can be swapped without touching calling code.
- **Context generation:** `buildInvestigationContext(investigationId)` server-side function assembles: case summary, all Pattern records, all RiskSignal records with explanations, graph summary (node/edge counts, key entities), timeline summary (key events with timestamps), and Follow-the-Money results if already computed. This structured payload is serialized to JSON and passed as context in the prompt.
- **Grounding strategy:** System prompt explicitly instructs: "Answer only using the JSON context provided. If the answer is not present in the context, say so. Never invent transaction IDs, amounts, or timestamps."
- **Output schema:** Plain text response, optionally with inline references like `(txn_1042, ₹45,000, 14:32)`.
- **Hallucination prevention:** No open-ended web/model knowledge is used; all facts must trace to context fields. Optionally validate that any transaction ID mentioned in the response exists in the context before displaying it.
- **Error fallback:** If `AI_API_KEY` is missing or the API call fails, return the deterministic evidence list with the message specified in Section 5G.

---

## 16. TECH STACK

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Visualization:** React Flow (investigation graph), Recharts (dashboard charts + timeline)
- **Backend:** FastAPI (Python) — chosen over Node so the same language can be used for both the API and the graph/pattern analytics (NetworkX, Pandas), avoiding a cross-language boundary for the most technically important part of the system
- **Database:** PostgreSQL (via Supabase for hackathon speed, or local Postgres + SQLAlchemy)
- **Analytics:** Python, NetworkX (graph algorithms), Pandas (temporal rolling windows)
**AI:** LLM API abstraction (Groq API — OpenAI-SDK compatible, base URL `https://api.groq.com/openai/v1`), server-side only
- **Deployment:** Vercel (frontend) + Render/Railway (FastAPI backend) + Supabase (Postgres)

Architecture is a **modular monolith**: one FastAPI app with clearly separated modules (`api/`, `analytics/`, `db/`) rather than microservices — appropriate for hackathon scope and reliability.

---

## 17. SYSTEM ARCHITECTURE

```
Frontend (Next.js)
    ↓ REST calls
API Layer (FastAPI routers)
    ↓
Investigation Service (orchestrates case retrieval/updates)
    ↓
Risk Engine  ←→  Graph Analytics (NetworkX)  ←→  Pattern Detectors
    ↓
Database (PostgreSQL via SQLAlchemy)
```

```
Frontend (AI Assistant panel)
    ↓
API: POST /investigations/:id/ask
    ↓
Context Builder (assembles structured JSON from DB)
    ↓
AIProvider (LLM API call, server-side, key never exposed to client)
```

**State management:** React Query (TanStack Query) for server state/caching on the frontend; no complex client-side global store needed.
**Security considerations:** all AI calls server-side only; `.env` for secrets; input validation via Pydantic models on every endpoint; rate limiting on `/ask` endpoint (simple in-memory limiter is sufficient for demo).

---

## 18. API SPECIFICATION

| Endpoint | Purpose | Request | Response | Errors |
|---|---|---|---|---|
| `GET /dashboard/summary` | Top-level metrics | — | `{suspicious_networks, high_risk_accounts, flagged_transactions, amount_under_investigation, active_investigations, escalated_cases}` | 500 on DB failure |
| `GET /investigations` | List cases | query: `status?, min_risk?` | `Investigation[]` (with entity/pattern summary) | — |
| `GET /investigations/:id` | Case detail | — | Full `Investigation` + patterns + risk signals | 404 |
| `GET /investigations/:id/graph` | Graph payload | — | `{nodes:[], edges:[]}` | 404 |
| `GET /investigations/:id/timeline` | Timeline payload | — | ordered `Transaction[]` with burst annotations | 404 |
| `GET /investigations/:id/evidence` | Evidence list | — | `Evidence[]` | 404 |
| `GET /accounts/:id` | Account detail | — | `Account` + linked devices/identifiers + transaction summary | 404 |
| `GET /transactions/:id` | Transaction detail | — | `Transaction` | 404 |
| `POST /investigations/:id/follow-money` | Trace fund flow | `{source_account_id, destination_account_id?, min_amount?, max_hops?}` | `{hops:[...]}` | 400 invalid params, 404 |
| `POST /investigations/:id/ask` | AI assistant query | `{question}` | `{answer, grounded: true|false}` | 503 if AI unavailable (returns fallback body, not a hard error) |
| `PATCH /investigations/:id/status` | Update case status | `{status}` | Updated `Investigation` | 400 invalid status |
| `POST /investigations/:id/notes` | Add note | `{note_text, user_id}` | Created `CaseNote` | 400 |
| `GET /investigations/:id/report` | Generate report | — | HTML (or JSON for frontend to render as printable page) | 404 |

---

## 19. FRONTEND PAGE STRUCTURE

- `/` — landing/demo entry, "Load Demo Investigation" CTA
- `/dashboard` — main dashboard (Section 6)
- `/investigations` — full case list with filters
- `/investigations/[id]` — case view (Section 7), with tab query param e.g. `?tab=graph`
- `/accounts/[id]` — account detail (transaction history, linked devices, involved cases)
- `/transactions/[id]` — single transaction detail (mostly reached via graph/timeline click-through, could be a modal instead of a full route)

---

## 20. UI/UX DESIGN SYSTEM

**Direction:** Dark, professional fintech/security aesthetic — closer to an internal SOC/AML analyst tool than a consumer banking app.

- **Typography:** A clean sans-serif for UI (e.g., Inter), monospace for IDs/amounts/timestamps to reinforce a "data terminal" feel.
- **Palette:** Dark neutral background (near-black/charcoal), single accent color for primary actions, distinct severity colors (gray/amber/red) used together with icons/badges — never color alone.
- **Spacing:** Consistent 8px-based spacing scale; generous padding in cards despite high information density.
- **Components:** Cards (metrics, case summary), data tables (sortable, sticky header), badges (severity, status, pattern type), buttons (primary/secondary/destructive), tooltips (on graph nodes and chart points), modals (confirmation on status change), drawers (node detail on graph click), empty/loading/error states for every data view (skeletons, not blank screens).
- **Graph styling:** As specified in Section 10.
- **Avoid:** generic SaaS template look, excessive gradients, glassmorphism, fake 3D, decorative animation, charts included just to fill space.

---

## 21. DEMO MODE

- Landing page button: **"Load Demo Investigation"** → immediately navigates to `/investigations/[flagship_id]?tab=graph`.
- Guided sequence available as an optional overlay/tour (P1): numbered tooltip steps matching the sequence in Section 3.
- The flagship case (Scenario 9, complex multi-pattern) must always exist after running the seed script — this is the case the demo button loads.
- No manual setup required by the judge: seed script runs once during initial deployment/build; the demo button only reads existing data.

---

## 22. INVESTIGATION REPORT

Rendered as an HTML view at `/investigations/:id/report` (printable via browser print-to-PDF for the hackathon — a dedicated PDF library is P2/optional). Contents: case summary, involved entities table, transaction totals, list of detected patterns with explanations, timeline summary, final risk score with factor breakdown, money trail (if Follow the Money was run), investigator notes, recommended action, case status history.

---

## 23. SECURITY AND PRIVACY

- All data is synthetic — no real financial/personal information anywhere in the codebase or seed data.
- `AI_API_KEY` and `DATABASE_URL` only in server-side environment variables, never in frontend bundle.
- `.env` excluded via `.gitignore`; `.env.example` committed with placeholder values.
- Pydantic request validation on every FastAPI endpoint.
- Basic rate limiting on `/ask` (e.g., 10 requests/minute per session) to avoid runaway API cost during the demo.
- Implement strict route protection using Next.js Middleware. The main dashboard and investigation routes must be completely inaccessible to unauthenticated users. Specifically, if a user attempts to enter the main website by tampering with the URL to access the root path (e.g., changing /login to just /), the middleware must instantly catch this and redirect them back to the /login route A logged-in investigator can modify case status/notes.
- Sanitize any free-text (case notes, AI questions) before storage/display to prevent XSS in the frontend.

---

## 24. ERROR HANDLING

| Failure | Behavior |
|---|---|
| API failure (network/500) | Frontend shows toast + retry button; no blank screen |
| Database failure | API returns 503 with a clear message; frontend shows a persistent banner |
| Empty investigation (no patterns found) | Case view shows "No suspicious patterns detected in this scope" instead of an empty graph |
| Malformed transaction data | Skip and log the row during seeding; never crash the pipeline |
| AI provider failure/missing key | Fallback message per Section 5G/15 |
| Missing environment variables | App fails fast at startup with a clear console error naming the missing variable |
| Graph generation failure | Case view falls back to a table view of entities/transactions with an inline error note |
| Report generation failure | Show error toast, keep the rest of the case view functional |

---

## 25. TESTING REQUIREMENTS

**Unit tests:**
- Each pattern detector (fan-out, fan-in, rapid pass-through, fragmentation, velocity, circular, shared-device, new-intermediary) against small synthetic transaction sets with known expected output.
- Risk scoring function (given fixed PatternResults, assert expected composite score and band).
- Money tracing (BFS/DFS) against a small fixed graph with a known correct path.
- Graph construction (correct node/edge counts from a fixed transaction set).
- Temporal analytics (rolling window counts, burst flag) against fixed time-series input.

**Integration tests:**
- `GET /investigations/:id` returns patterns/risk consistent with seeded scenario data.
- `GET /investigations/:id/graph` returns valid node/edge structure.
- `POST /investigations/:id/follow-money` returns a correct hop sequence for the layered-movement scenario.
- `POST /investigations/:id/ask` returns the fallback message when `AI_API_KEY` is unset.

**Frontend tests (if time permits):** Dashboard renders metrics; case view renders graph without crashing given mock data.

**Manual acceptance tests:** Walk through the full demo script (Section 35) end to end before final submission.

---

## 26. SEED DATA TEST CASES

| Scenario | Expected detectors | Expected risk level | Expected graph shape |
|---|---|---|---|
| 1. Normal customers | none | Low | Sparse, isolated small clusters |
| 2. Normal high-frequency business | none (or velocity flagged but suppressed by whitelist/context) | Low | One high-degree node, no fan-out pattern flagged (steady, not bursty) |
| 3. Fan-out fraud network | fan_out, velocity | High | One source, 8 direct destinations (star shape) |
| 4. Layered money movement | rapid_pass_through (chained) | High | Linear chain, 4+ hops |
| 5. Circular transaction network | circular_movement | Critical | Cycle A→B→C→A visible in graph |
| 6. Shared-device mule network | shared_device | High | Cluster of accounts linked via one device node |
| 7. Rapid pass-through | rapid_pass_through | Medium-High | Multiple short in→out chains |
| 8. Transaction fragmentation | fragmentation, velocity | Medium | One source, one destination, many thin parallel edges |
| 9. Complex multi-pattern (flagship) | fan_out, rapid_pass_through, shared_device, circular_movement | Critical | Combined star+chain+cycle structure — this is the demo centerpiece |

---

## 27. ACCEPTANCE CRITERIA

- Dashboard loads with seeded data and correct top-level counts.
- At least 6 distinct investigation cases exist after seeding (one per fraud scenario, benign scenarios do not generate cases).
- Investigator can open any case and see a non-empty graph with ≥2 entity types.
- Clicking a node opens a detail drawer with real data (not placeholder text).
- All 8 pattern detectors fire correctly on their corresponding seeded scenario and do NOT false-positive on the benign scenarios.
- Every displayed risk score has an accompanying, non-empty evidence/reasons list.
- Follow the Money returns a correct multi-hop path for the layered-movement scenario (Scenario 4) and the flagship case.
- Timeline reflects actual seeded transaction timestamps in correct order.
- AI assistant answers reference real entities/transaction IDs from the current case, or shows the fallback message when no API key is configured.
- Case status can be changed and persists on reload.
- "Load Demo Investigation" reaches the flagship case graph in under 60 seconds with zero manual setup.
- No hard-coded fake numbers are displayed anywhere as if they were live analytics — all displayed values must originate from the seeded data or computed analytics.

---

## 28. MVP IMPLEMENTATION ORDER

1. Project setup and architecture (repo scaffold, both apps running locally)
2. Database schema + migrations
3. Synthetic data generation script (all 9 scenarios)
4. Graph engine (NetworkX construction from DB data)
5. Detection engine (all 8 detectors, unit-tested against seed data)
6. Risk scoring engine
7. Backend APIs (Section 18, in order of Section 3's user journey)
8. Dashboard (frontend)
9. Investigation graph (frontend, React Flow)
10. Timeline (frontend)
11. Follow-the-money (backend trace + frontend visualization)
12. AI assistant (context builder + provider integration + frontend chat panel)
13. Case management (status workflow, notes)
14. Report generation
15. UI polish pass
16. Testing pass (fill gaps from Section 25)
17. Deployment

---

## 29. ANTIGRAVITY EXECUTION RULES

- Read this entire document before writing any code.
- Do not implement P1/P2 features before the P0 vertical slice (seed data → detection → risk → dashboard → one working case view with graph) is fully functional end-to-end.
- Keep the application runnable after every phase in Section 28 — commit working states.
- Build reusable UI components (badge, card, table, graph-node-renderer) rather than one-off markup per page.
- Avoid unnecessary dependencies — prefer the stack in Section 16 as specified.
- Use TypeScript types for all frontend data shapes matching the API response schemas exactly (define shared types once, e.g., in `packages/shared`).
- Keep backend/frontend contracts explicit — document response shapes in code comments or a lightweight OpenAPI schema (FastAPI generates this automatically; use it).
- Do not generate fake analytics that contradict the seeded dataset — every number shown must be derivable from the DB.
- Do not hard-code investigation conclusions (e.g., "this is fraud") outside of what the detection engine actually computed.
- Every visible risk explanation must be traceable to a specific `Evidence`/`RiskSignal`/`Pattern` record.
- Use deterministic seed data (fixed random seed) so re-running the seed script produces the same demo every time.
- Never expose `AI_API_KEY` or `DATABASE_URL` to the client bundle.
- Maintain a clean folder structure per Section 30.
- Add a `README.md` with setup instructions, a `.env.example`, a database setup script, and a seed script, and a one-command local startup (e.g., `docker-compose up` or a documented two-terminal `npm run dev` + `uvicorn` combo).
- Prioritize functional correctness first; perform a dedicated visual polish pass only once the P0 vertical slice works end-to-end.
- Before writing significant code, inspect the existing repository state, determine what already exists, and implement incrementally rather than regenerating from scratch.
- When a reasonable assumption can be made from this document, make it and proceed — do not stall waiting for clarification. Record any non-trivial assumptions in `docs/development-notes.md`.

---

## 30. FOLDER STRUCTURE

```
/apps
  /web            → Next.js frontend
  /api            → FastAPI backend (routers, services)
/analytics
  /graph          → NetworkX graph construction + algorithms (Section 12)
  /patterns       → Pattern detectors + config (Section 5B, 11)
  /risk           → Risk aggregation engine (Section 14)
  /temporal       → Rolling window / burst detection (Section 13)
/packages
  /shared         → Shared TypeScript types mirroring API response schemas
/data
  /seed           → generate_seed_data.py + scenario definitions
/docs             → development-notes.md, architecture notes
/tests            → unit + integration tests (mirrors /analytics and /apps/api structure)
```

Purpose: `/analytics` is deliberately separated from `/apps/api` so the detection/risk/graph logic is independently unit-testable and reusable, and could later be swapped for an ML pipeline without touching API routing code.

---

## 31. ENVIRONMENT VARIABLES

```
DATABASE_URL=postgresql://user:password@host:5432/tracefuse
AI_API_KEY=
AI_MODEL=llama-3.3-70b-versatile
AI_BASE_URL=https://api.groq.com/openai/v1
NEXT_PUBLIC_API_URL=http://localhost:8000
ENVIRONMENT=development
```
Never commit real values — only `.env.example` with placeholders is checked into Git.

---

## 32. PERFORMANCE REQUIREMENTS

- Dashboard should load under ~1s locally against the seeded dataset size (hundreds, not millions, of rows).
- Graph rendering should stay smooth up to a few hundred nodes/edges per investigation — the seeded dataset should not exceed this per case.
- Avoid recomputing pattern detection on every page load — run detection at seed time (or on-demand with caching) and store results in `Pattern`/`RiskSignal` tables rather than recalculating live on each request.
- Precompute the flagship demo investigation's graph/timeline/risk data during seeding so the demo button is instant.
- Do not prematurely optimize beyond what the above requires.

---

## 33. HACKATHON WOW MOMENTS

- **WOW #1:** A seemingly ordinary account expands, on click, into a visibly suspicious multi-entity network.
- **WOW #2:** "Follow the Money" animates fund flow across 3–5 hops that would be invisible looking at any single transaction.
- **WOW #3:** The timeline reveals that an entire laundering sequence completed within minutes.
- **WOW #4:** The AI assistant answers "Why is this account suspicious?" with a grounded, specific, evidence-cited explanation.
- **WOW #5:** A full investigation report is generated in one click from everything just explored.

## 33A. JUDGE IMPACT REQUIREMENTS

The product must communicate its value within the first 15–20 seconds of the demonstration.

The judge should immediately understand four things:

1. Single transactions can appear normal in isolation.
2. TraceFuse connects transactions, entities, devices, and time into a single investigation view.
3. The system identifies patterns that are difficult to see manually.
4. The system converts those patterns into actionable investigative evidence.

The primary visual story should follow this sequence:

ONE NORMAL-LOOKING TRANSACTION
        ↓
CONNECTED NETWORK
        ↓
MULTI-HOP MONEY TRAIL
        ↓
TEMPORAL PATTERN
        ↓
EVIDENCE
        ↓
INVESTIGATION RISK SCORE
        ↓
AI EXPLANATION
        ↓
INVESTIGATOR ACTION

The flagship demo should avoid opening on a generic metrics dashboard for an extended period.

The graph and Case Genesis should appear early enough that the judge understands the product's unique capability before secondary dashboard metrics are discussed.

At least one demonstration moment must clearly show:
"These transactions are not individually extraordinary, but their relationship and timing reveal a suspicious network."

The UI should make this relationship visually obvious rather than relying entirely on spoken explanation.

The project should feel like:
"an analyst discovering hidden financial structure"

and not:
"a dashboard displaying fraud statistics."

During the final demo, the team should explicitly state that TraceFuse is a focused prototype using synthetic data and deterministic investigation heuristics, not a production AML system or legal fraud determination engine.

---

## 34. WHAT NOT TO BUILD

Do not build: real banking integrations, real UPI transfers, production AML compliance workflows, full KYC infrastructure, real customer onboarding, a mobile app, blockchain (unless a clearly justified, small addition), custom-trained ML models, microservices, a generic chatbot unrelated to case evidence, or a generic analytics dashboard disconnected from the investigation workflow.

---

## 35. FINAL DEMO SCRIPT (3–5 minutes)

1. **Opening problem (20s):** "Fraud that's spread across many small transactions and accounts is nearly invisible to single-transaction fraud detectors — and that's exactly the kind of fraud that does the most damage."
2. **Incident (20s):** Click "Load Demo Investigation" — the flagship multi-pattern case loads.
3. **Investigation (30s):** Show the case header: Critical risk, multiple pattern types flagged.
4. **Graph (40s):** Walk through the network graph — point out the fan-out, the shared-device cluster, the cycle back to the origin.
5. **Pattern discovery (30s):** Open the patterns panel, read 2–3 plain-language pattern explanations aloud.
6. **Money trail (40s):** Run Follow the Money from the source account, show the animated multi-hop trace.
7. **Evidence (20s):** Show the evidence list tied to transaction IDs.
8. **AI explanation (30s):** Ask the assistant "Why is this account suspicious?" live, read the grounded answer.
9. **Action (20s):** Escalate the case, generate the report, show the exported summary.
10. **Close (10s):** Restate the differentiator: "This isn't a fraud score — it's an investigation, reconstructed automatically."

---

## 36. DEVELOPMENT CHECKLIST

**Foundation**
- [ ] Repo scaffolded per Section 30
- [ ] Frontend + backend run locally together
- [ ] `.env.example` and README written

**Database**
- [ ] Schema (Section 8) migrated
- [ ] Indexes on transaction source/destination + timestamp

**Seed data**
- [ ] All 9 scenarios generated deterministically
- [ ] Seed script idempotent and documented

**Graph**
- [ ] NetworkX construction from DB
- [ ] Cycle detection, degree/centrality implemented

**Detection**
- [ ] All 8 detectors implemented and unit-tested against seed scenarios
- [ ] Detector config externalized (no hardcoded thresholds inline)

**Risk**
- [ ] Composite scoring implemented with category breakdown
- [ ] Guard rail (single-signal cap) implemented
- [ ] Score bands applied

**Backend**
- [ ] All endpoints in Section 18 implemented and documented via FastAPI's auto-schema
- [ ] Follow-the-money BFS implemented and tested

**Frontend**
- [ ] Dashboard (Section 6)
- [ ] Case view (Section 7)
- [ ] Graph component (React Flow, Section 5A/10)
- [ ] Timeline component (Section 5C)
- [ ] Follow the Money visualization (Section 5D)

**AI**
- [ ] Context builder implemented
- [ ] Provider abstraction + Groq integration
- [ ] Fallback message wired for missing key/failure

**Investigation workflow**
- [ ] Status transitions (New→Investigating→Escalated→Resolved)
- [ ] Case notes

**Reports**
- [ ] Report view implemented and printable

**Testing**
- [ ] Unit tests for all detectors + risk engine + tracing
- [ ] Integration tests for key endpoints
- [ ] Manual acceptance test pass (Section 27) completed

**Polish**
- [ ] Empty/loading/error states on every view
- [ ] Design system applied consistently (Section 20)

**Deployment**
- [ ] Frontend deployed (Vercel)
- [ ] Backend deployed (Render/Railway)
- [ ] Database deployed (Supabase/managed Postgres)
- [ ] Production env vars set, `.env` not committed

**Demo**
- [ ] "Load Demo Investigation" verified end-to-end on deployed instance
- [ ] Full demo script (Section 35) rehearsed at least twice

---

## 37. DEFINITION OF DONE

The project is done when it: runs locally with one documented startup process; loads correctly with seeded data on first run; contains all 9 realistic scenarios; correctly detects the intended multi-transaction patterns in the fraud scenarios without false-positiving on the benign ones; visualizes entity relationships as an interactive graph; traces money movement across multiple hops; explains every risk score with concrete, evidence-linked reasons; provides an AI assistant that answers grounded in real case data (or gracefully falls back); supports the full investigator workflow (open → investigate → escalate/resolve); has a polished, professional dark-fintech UI; handles every failure mode in Section 24 gracefully; is demo-ready via the one-click demo mode; and is deployed and reachable at a public URL. The application is NOT considered complete if an unauthenticated user can bypass the login screen and access the main application simply by changing the URL paths in the browser.

---

## 38. TECHNICAL DECISION PRINCIPLES

When choosing between implementation alternatives, prefer in this order: (1) reliability, (2) demo impact, (3) implementation speed, (4) explainability, (5) maintainability, (6) technical sophistication for its own sake — last, never first. Do not select a technology or algorithm merely because it sounds advanced; every technical choice in this document was selected because it directly supports a visible feature or acceptance criterion above.

---

## 39. FINAL INSTRUCTION TO ANTIGRAVITY

Begin development from this specification. Before writing significant amounts of code, inspect the repository, determine what already exists, identify the minimum viable vertical slice (seed data → detection engine → risk engine → one working case view with graph, timeline, and Follow the Money → demo button), and implement the project incrementally, phase by phase per Section 28. Do not wait for additional clarification when reasonable assumptions can be made from this document — record such assumptions in `docs/development-notes.md`. Validate every major feature against the acceptance criteria in Section 27 as you build it, keep the application runnable throughout development, prioritize the flagship investigation workflow (Sections 3, 5, 35) above all optional polish, test every seeded fraud scenario against its expected detector output (Section 26), and perform a full end-to-end demo rehearsal (Section 35) before considering the project complete.
