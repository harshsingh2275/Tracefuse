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
