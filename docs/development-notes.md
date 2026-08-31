# TraceFuse — Development Notes & Assumptions

This document records architectural decisions, assumptions, and clarifications made during implementation, per Section 29 of `task.md`.

---

## 1. Project Initialization & Scaffolding (Phase 1)
- **Date:** Initial Scaffold
- **Assumptions & Decisions:**
  - **Modular Monorepo Structure:** Following Section 30 with `/apps/web` (Next.js App Router, React, TypeScript, Tailwind CSS), `/apps/api` (FastAPI, Python 3.12), `/analytics/*` (independent graph, pattern, risk, temporal logic), `/packages/shared` (TypeScript types matching OpenAPI/Pydantic models), `/data/seed` (synthetic generator), `/docs` (documentation), and `/tests` (pytest suite).
  - **Database Compatibility:** Primary target is PostgreSQL / Supabase per Section 16/31. SQLite will also be supported transparently via SQLAlchemy connection string fallback for zero-friction local developer testing without requiring a live external Postgres instance.
  - **Authentication Strategy:** Gated demo authentication via simple hardcoded judge credentials (`demo2026`) with Next.js Middleware route guarding per Sections 3, 23, and 37 to ensure unauthorized direct URL tampering is prevented.
  - **Offline/Deterministic Fallback for AI:** If `AI_API_KEY` is not provided or Groq API is unreachable, the AI assistant gracefully returns deterministic case evidence and context rather than crashing.

## 2. Database Schema & Deterministic Seed Data (Step 2 & 3)
- **Date:** MVP Order Step 2 & 3
- **Schema Implementation:**
  - Full ORM schema created in `apps/api/models.py` covering `User`, `Account`, `Entity`, `AccountEntity`, `Device`, `AccountDevice`, `Identifier`, `AccountIdentifier`, `Transaction`, `Investigation`, `InvestigationEntity`, `Pattern`, `RiskSignal`, `Evidence`, `CaseNote`, and `CaseAction`.
  - Composite indexes added to `transactions` on `(source_account_id, timestamp)` and `(destination_account_id, timestamp)` for fast temporal and BFS queries.
- **Seed Generator Implementation:**
  - `data/seed/generate_seed_data.py` generates all 9 scenarios with fixed seed (42).
  - Clean drop-and-recreate lifecycle ensures true idempotency.
  - Generates 69 accounts, 61 entities, 39 devices, and 692 transactions.
  - Benign transactions account for 94.1% of total transaction volume (requirement: >=70%), ensuring fraud patterns emerge through pattern detection rather than superficial transaction counts.
  - Scenario 9 (Flagship demo case `inv_flagship_demo`) correctly synthesizes the ₹8.4L money trail: origin account, 5 fan-out mules, shared hardware fingerprint (`dev_flagship_shared_01`), 2-hop rapid layering, final beneficiary vault, and circular kickback.

## 3. Graph, Pattern Detectors & Risk Engines (Steps 4, 5, 6)
- **Date:** MVP Order Steps 4, 5, 6
- **Graph Engine (`analytics/graph/`):**
  - Built `build_networkx_graph` and `get_investigation_graph_payload` creating React Flow compatible subgraphs with accounts, entities, devices, and transaction edges.
  - Implemented `detect_cycles` with bounded DFS (depth $\le 6$) and canonical hashing for ultra-fast cycle resolution.
  - Implemented `calculate_centrality` (degree & betweenness) and `follow_the_money` with bounded FIFO fund provenance attribution per Section 5D & 178.
- **Pattern Detectors (`analytics/patterns/`):**
  - Thresholds externalized into `analytics/patterns/config.py` (no hardcoded inline constants).
  - Implemented all 8 detectors: `fan_out`, `fan_in`, `rapid_pass_through`, `fragmentation`, `velocity`, `circular_movement`, `shared_device`, `new_intermediary`.
  - All detectors produce structured `PatternResult` objects with plain-language evidence strings and cited transaction IDs.
  - Verified 0 false positives on benign Scenarios 1 & 2.
- **Risk Scoring Engine (`analytics/risk/`):**
  - Weighted composite score across 6 categories: Velocity (0.15), Graph (0.20), Temporal (0.20), Fragmentation (0.15), Circular (0.15), Entity Reuse (0.15).
  - Single-signal guard rail cap: isolated heuristics capped at 60 points max (Medium band ceiling) unless corroborated by multiple independent signals.
  - Generates evidence-backed reasons list and maps scores to bands (Low, Medium, High, Critical).
- **Test Suite (`tests/test_analytics.py`):**
  - 20 unit and integration tests passing covering all 8 detectors, zero false-positives on benign data, Follow the Money multi-hop paths, and risk guard rail mechanics.

## 4. Backend API Layer & Endpoints (Step 7)
- **Date:** MVP Order Step 7
- **FastAPI Endpoints Implemented (Section 18):**
  - `GET /dashboard/summary`: Top-level operational metrics (`suspicious_networks`, `high_risk_accounts`, `flagged_transactions`, `amount_under_investigation`, `active_investigations`, `escalated_cases`).
  - `GET /investigations`: Paginated/filterable investigation queue sorted by risk score.
  - `GET /investigations/{id}`: Detailed investigation dossier with computed patterns, risk breakdown, entity profiles, notes, actions, and Case Genesis trigger summary.
  - `GET /investigations/{id}/graph`: Scoped React Flow payload (`nodes`, `edges`) with node risk badges and edge amount scaling.
  - `GET /investigations/{id}/timeline`: Ordered event sequence with burst tags.
  - `GET /investigations/{id}/evidence`: Structured evidence list linking detector firings to concrete transaction IDs.
  - `POST /investigations/{id}/follow-money`: Multi-hop BFS fund provenance tracing with FIFO queue model.
  - `POST /investigations/{id}/ask`: Grounded AI Assistant (Groq LLM) with strict JSON context injection, citation extraction, deterministic offline fallback, and rate limiting (10 req/min).
  - `PATCH /investigations/{id}/status`: State machine transitions (`new` -> `investigating` -> `escalated` -> `resolved`) + `CaseAction` audit trail.
  - `POST /investigations/{id}/notes`: Case note append.
  - `GET /investigations/{id}/report`: Printable compliance handoff report.
  - `GET /accounts/{id}`: Account entity profile, associated hardware devices, identifiers, and inflow/outflow totals.
  - `GET /transactions/{id}`: Individual transaction inspection with counterparty names.
- **Contract Synchronization:**
  - All response schemas mirrored in `@tracefuse/shared` TypeScript definitions (`packages/shared/index.ts`).
- **Test Suite (`tests/test_api.py`):**
  - 15 integration tests covering every endpoint, error handling (404/422), rate limiting, and state transitions. Total test suite across all modules: 35 passing tests.

## 5. Login Gate & Overview Dashboard (Section 3, 6, 23)
- **Date:** MVP Order Step 8
- **Authentication Gate (`apps/web/src/app/login/page.tsx`):**
  - Financial Crime Cockpit dark-terminal login screen.
  - Supports demo passcode `demo2026` and single-click judge sign-in button for instant evaluation.
  - Sets secure session cookie `tracefuse_session=authenticated_analyst`.
- **Strict Next.js Middleware Protection (`apps/web/src/middleware.ts`):**
  - Edge server-side request interception checking `tracefuse_session`.
  - Unauthenticated requests to `/`, `/dashboard`, `/investigations`, or any sub-route are immediately redirected to `/login` with `307/302 Temporary Redirect` before any UI or HTML is rendered.
- **Overview Dashboard (`apps/web/src/app/dashboard/page.tsx`):**
  - 6 Top-level metrics cards (Suspicious Networks, High-Risk Accounts, Flagged Transactions, Flow Under Investigation, Active Cases, Escalated Cases).
  - Suspicious cases table with search, status tabs (`all`, `new`, `investigating`, `escalated`, `resolved`), risk score sorting, and pattern badges.
  - Visual analytics with Recharts (Risk Band Distribution and Pattern Signature frequency).
  - Flagship Scenario 9 hero banner with 1-click &quot;Explore Flagship Graph&quot; CTA.
  - Connected to live backend API at `http://localhost:8000`.

## 6. Investigation Graph, Timeline & Case Dossier (Steps 9 & 10)
- **Date:** MVP Order Steps 9 & 10
- **Investigation Graph (`apps/web/src/components/graph/InvestigationGraph.tsx`):**
  - Built with `@xyflow/react` (React Flow 12) featuring custom nodes (`AccountNode`, `DeviceNode`, `EntityNode`) and custom edges (`TransactionEdge`).
  - Scoped strictly to the active investigation's entities and transactions.
  - Interactive features: search & filter highlight, hide/show non-transaction hardware nodes, node click entity inspection drawer (Section 19), edge click transaction inspector, minimap, and zoom controls.
- **Investigation Timeline (`apps/web/src/components/timeline/InvestigationTimeline.tsx`):**
  - Chronological transaction feed with burst annotations and elapsed time counters.
  - Interactive playback scrubber allowing investigators to step through transactions chronologically.
  - Filters for high-value transactions ($\ge \text{₹}1\text{L}$) and account search.
- **Full Case Dossier Page (`apps/web/src/app/investigations/[id]/page.tsx`):**
  - Header displaying Risk Score + Band badge, Case Status updater, and Case Genesis trigger drawer (Section 5F).
  - 5 Interactive tabs: **Network Graph**, **Timeline Flow**, **Patterns & Risk Breakdown**, **Evidence Locker**, and **Case Notes & Audit Trail**.
- **Scenario 9 Flagship Case Verification:**
  - Graph correctly visualizes the combined Star (5 mules) + Chain (2-hop layering) + Cycle (circular kickback) + Shared Device (`dev_flagship_shared_01`).
  - Timeline strictly preserves deterministic transaction sequence from origin disbursement to final kickback.

## 7. Flagship "Follow the Money" Multi-Hop Provenance (Step 11)
- **Date:** MVP Order Step 11
- **FIFO Provenance Algorithm (`analytics/graph/algorithms.py`):**
  - Implemented multi-hop FIFO queue provenance model per Section 5D & 178.
  - Bounded BFS with non-decreasing timestamps, preserving strict fund flow attribution.
  - Computes cumulative trail volume, total elapsed minutes, and per-hop latency (`hop_elapsed_minutes`).
- **Interactive Trace Visualizer (`apps/web/src/components/graph/FollowMoneyController.tsx`):**
  - Dedicated controller with Source Account selector, optional Destination filter, Min Amount filter, and Max Hops slider.
  - Interactive playback animation: stepping through hops sequentially and highlighting nodes and glowing edges on the React Flow canvas.
  - Hop-by-hop breakdown cards detailing Hop #, From $\rightarrow$ To accounts, amount in INR, timestamp, transaction ID, and latency metrics.
- **Verification Across Scenarios:**
  - **Scenario 4 (`inv_layering_chain`)**: Successfully traces the 4-hop rapid pass-through chain (`acc_s4_hop_01` $\rightarrow$ `02` $\rightarrow$ `03` $\rightarrow$ `04` $\rightarrow$ `05`) with exact amounts.
  - **Scenario 9 (`inv_flagship_demo`)**: Successfully traces the multi-hop fund dispersion from the origin through the 5 fan-out mules to layering conduits.
  - Full suite of 36 unit and integration tests passing (`pytest`).

## 8. Grounded AI Assistant & Copilot (Step 12)
- **Date:** MVP Order Step 12
- **Strict Evidence Grounding Context (`apps/api/services/context_builder.py`):**
  - Synthesizes structured JSON payload containing active investigation case details, entities, hardware devices, detected patterns, risk signals, and Follow-the-Money hops.
  - System prompt strictly instructs the LLM to only answer based on injected JSON evidence without hallucinating fake transaction IDs.
- **Provider Abstraction & Groq Client (`apps/api/services/ai_service.py`):**
  - Uses `groq` SDK client with `AI_MODEL="llama-3.3-70b-versatile"` and `AI_BASE_URL="https://api.groq.com/openai/v1"`.
  - In-memory rate limiting (10 requests/minute per client IP).
- **Deterministic Offline Fallback (Section 5G & 15):**
  - If `AI_API_KEY` is not provided or API calls fail, the system smoothly falls back to deterministic rule-based evidence synthesis citing exact transaction IDs, amounts, and detected patterns with `fallback_used: true` and `grounded: true`.
- **Frontend Copilot Panel (`apps/web/src/components/ai/AIAssistantPanel.tsx`):**
  - Slide-out / expandable copilot drawer with suggested quick prompts, Markdown formatting, and cited transaction badges.
  - Accessible via floating trigger button or case header CTA across all investigation views.

## 9. Case Management Workflow & Printable Compliance Report (Steps 13 & 14)
- **Date:** MVP Order Steps 13 & 14
- **Case Status State Machine (Section 7):**
  - State transitions: `New` $\rightarrow$ `Investigating` $\rightarrow$ `Escalated` $\rightarrow$ `Resolved`.
  - Audited via `CaseAction` table recording previous state, new state, user ID, and timestamp.
  - Status updates and notes persist to database and reload state seamlessly.
- **Investigator Case Notes:**
  - Full CRUD integration allowing analysts to add timestamped findings attributed to investigator IDs.
- **Printable Investigation Report (`apps/web/src/app/investigations/[id]/report/page.tsx`):**
  - Route at `/investigations/:id/report` with browser print-to-PDF styles (`@media print`).
  - Structured into 10 regulatory sections:
    1. Header & Security Classification (`CONFIDENTIAL // COMPLIANCE SAR`)
    2. Executive Summary & Recommended Action
    3. Entities Involved Table (Account IDs, holders, types, numbers)
    4. Detected Patterns Breakdown with confidence and cited transaction IDs
    5. Multi-Hop Money Trail Sequence with latencies
    6. Case Notes with timestamps & analyst IDs
    7. Status History & Audit Trail (`CaseAction` records)
    8. Formal Sign-off Blocks for Investigating and Compliance Officers
- **Failure Mode Resilience (Section 24):**
  - Report fetch errors or data failures are isolated with user-friendly retry banners without crashing the dossier view.
- **Test Suite Status:** 38 unit and integration tests passing (`pytest`).
