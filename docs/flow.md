# TraceFuse — Execution Flow Map

Real call paths through the system, updated after every change that alters routing,
component hierarchy, or API shape. This is a "what calls what" reference, not a prose
architecture overview.

---

## Auth + Route Guard Flow

```
Browser request to any UI route (dashboard, investigations, etc.)
  └─ Next.js Edge Middleware  (apps/web/src/middleware.ts)
       ├─ Reads HttpOnly cookie: tracefuse_jwt
       ├─ If unauthenticated:
       │    └─ Redirect 307 → /login?from=<original_path>
       │         /login page (apps/web/src/app/login/page.tsx)
       │           ├─ Manual Passcode:
       │           │    └─ POST /api/auth/login  (apps/web/src/app/api/auth/login/route.ts)
       │           │         ├─ Cross-origin client fetch: POST `${API_BASE_URL}/auth/login` { credentials: "include" }
       │           │         │    └─ Backend returns HttpOnly, Secure=True, SameSite=None cookie: tracefuse_jwt
       │           │         └─ Server-to-server: POST http://localhost:8000/auth/login via Next.js route
       │           │              ├─ Validates passcode against DEMO_PASSCODE / ADMIN_PASSCODE
       │           │              ├─ Issues signed HS256 JWT (12h expiry, secret from JWT_SECRET)
       │           │              └─ Sets local Next.js route gating cookie: tracefuse_jwt
       │           └─ Judge Fast-Track ("Load Demo Investigation" button):
       │                ├─ Cross-origin client fetch: POST `${API_BASE_URL}/auth/login` with "demo2026"
       │                └─ POST /api/auth/demo-login  (apps/web/src/app/api/auth/demo-login/route.ts)
       │                     └─ Sets local route gating cookie and router.push("/investigations/inv_flagship_demo?tab=graph")
       └─ If authenticated + visiting /login or /:
            └─ If query has ?expired=true or ?reauth=true: exempt from redirect & clear stale cookie
            └─ Otherwise: Redirect 307 → /dashboard

Browser / Client Direct API Requests:
  └─ fetch(`${NEXT_PUBLIC_API_URL}${endpoint}`, { credentials: "include" })
       └─ FastAPI Backend Route Protection:
            └─ verify_session_token dependency  (apps/api/auth.py)
                 ├─ Extracts token from HttpOnly cookie `tracefuse_jwt` (or Authorization: Bearer header)
                 ├─ Missing token → HTTPException 401 ("Authentication required. Missing session token.")
                 ├─ Validates HS256 signature against JWT_SECRET and expiration
                 ├─ Expired / Invalid → HTTPException 401 ("Session expired" / "Invalid session token")
                 └─ Injects decoded analyst payload: {"sub": "usr_analyst_01", "role": "analyst"}
```

**Non-obvious:** The Next.js middleware performs fast edge UI gating by checking the cookie's presence,
but the FastAPI backend independently decodes and verifies the cryptographic HS256 signature on EVERY
data and mutating endpoint via the `verify_session_token` dependency. Because the frontend (Vercel) and
backend (Render) reside on different domains in production, FastAPI issues `SameSite=None; Secure=True`
cookies, and the frontend client authenticates directly against the backend with `credentials: "include"`.
Client-side JavaScript never has access to the raw token (HttpOnly) and contains zero hardcoded passcodes
or credentials. `/login` renders synchronously in SSR without `<Suspense>` or `useSearchParams()`.
`fetchJson` guards against 401 redirect loops by clearing local cookies and redirecting with `expired=true`
at most once (tracked via `sessionStorage`), while the dashboard component halts loading on error with
a clean manual retry / re-login interface.

---

## Dashboard Page

```
/dashboard  (apps/web/src/app/dashboard/page.tsx)
  └─ useEffect → fetchData()   [parallel]
       ├─ api.getDashboardSummary()
       │    └─ GET /dashboard/summary
       │         └─ dashboard.router  (apps/api/routers/dashboard.py)
       │              └─ Direct DB queries: counts of Investigation, Account, Transaction
       │                   returns: DashboardSummaryResponse
       └─ api.getInvestigations()
            └─ GET /investigations
                 └─ investigations.router → list_investigations()
                      ├─ DB: query all Investigations, optional status/min_risk filter
                      ├─ For EACH investigation → _compute_investigation_analytics()  ⚠️ called N times
                      │    ├─ DB: InvestigationEntity → account_ids
                      │    ├─ DB: Account.filter(id.in_(account_ids))
                      │    ├─ DB: Transaction.filter(source OR dest in account_ids, within time_window)
                      │    ├─ DB: AccountDevice, Device
                      │    ├─ DetectionEngine.run_all(transactions, accounts, devices, account_devices)
                      │    │    └─ Runs all 8 detectors in sequence, catches individual exceptions
                      │    └─ RiskScoringEngine.calculate_risk(patterns)
                      └─ Returns InvestigationListItem[] (sorted by risk_score DESC)

Renders:
  Navbar, MetricCard ×6, Recharts BarChart + PieChart,
  Search/filter/sort controls, investigation table rows → each links to /investigations/:id
```

**Non-obvious:** `_compute_investigation_analytics()` runs the full pattern detection and risk
scoring pipeline for **every investigation on every list request** — O(N×detectors). No caching.
Acceptable at demo scale; would need background job pre-computation in production.

---

## Investigation Detail Page (Case Dossier)

```
/investigations/:id  (apps/web/src/app/investigations/[id]/page.tsx)
  └─ useEffect → fetchData()   [parallel, Promise.all]
       ├─ api.getInvestigationDetail(id)
       │    └─ GET /investigations/:id
       │         └─ get_investigation_detail()
       │              ├─ DB: Investigation by id  → 404 if not found
       │              ├─ _compute_investigation_analytics()  (same pipeline as above)
       │              ├─ DB: CaseNote.filter(investigation_id)  ordered asc
       │              ├─ DB: CaseAction.filter(investigation_id)  ordered asc
       │              ├─ Builds: entities_response, patterns_response, signals_response,
       │              │          evidence_response, notes_res, actions_res, case_genesis
       │              └─ Returns: InvestigationDetailResponse
       ├─ api.getInvestigationGraph(id)
       │    └─ GET /investigations/:id/graph
       │         └─ get_investigation_graph()
       │              └─ analytics.graph.builder.get_investigation_graph_payload(id, db)
       │                   ├─ DB: InvestigationEntity → account_ids
       │                   ├─ DB: Account, Entity, AccountEntity, Device, AccountDevice,
       │                   │       Identifier, AccountIdentifier, Transaction
       │                   ├─ build_networkx_graph(...)   → NetworkX MultiDiGraph
       │                   └─ Serializes to React Flow JSON: {nodes[], edges[]}
       │                        Node types: account / person / merchant / beneficiary / device
       │                        Edge types: transaction / owns / uses-device / linked-to
       └─ api.getInvestigationTimeline(id)
            └─ GET /investigations/:id/timeline
                 └─ get_investigation_timeline()
                      ├─ DB: Investigation → 404 if not found
                      ├─ _compute_investigation_analytics()
                      └─ analytics.temporal.analysis.get_timeline_events(transactions)
                           └─ Returns TimelineEventResponse[] with burst_tag annotations

Renders (tab-controlled):
  ├─ Tab "graph"    → InvestigationGraph (React Flow canvas)
  │                     ├─ AccountNode / DeviceNode / EntityNode  (CustomNodes.tsx)
  │                     │    └─ formatAccountCode / formatEntityCode / formatISTDateTime
  │                     ├─ TransactionEdge  (CustomEdges.tsx)
  │                     │    └─ amount pill suppressed for non-transaction edge_types
  │                     ├─ Node click → entity inspector drawer (inline state)
  │                     └─ Edge click → transaction/relationship inspector drawer (inline state)
  ├─ Tab "follow-money" → FollowMoneyController (nested inside InvestigationGraph panel)
  │                         └─ api.followTheMoney(id, sourceId, destId?, maxHops, minAmount?)
  ├─ Tab "timeline" → InvestigationTimeline
  │                     └─ timelineEvents from fetchData, no additional API call
  ├─ Tab "patterns" → inline pattern cards + risk breakdown  (from detail response)
  ├─ Tab "evidence" → evidence cards with humanizeEvidenceText()
  └─ Tab "notes"    → case notes feed + add-note form
                         └─ handleAddNote() → api.addNote() → POST /investigations/:id/notes
```

---

## Follow-the-Money Trace

```
FollowMoneyController (component)
  └─ User clicks "Trace" → api.followTheMoney(id, sourceAccountId, destId?, maxHops, minAmount?)
       └─ POST /investigations/:id/follow-money
            └─ follow_the_money_trace()
                 ├─ DB: Investigation → 404 if not found
                 ├─ _compute_investigation_analytics()  (needed for transactions list)
                 └─ analytics.graph.algorithms.follow_the_money(
                        source_account_id, transactions, max_hops, destination_account_id, min_amount
                    )
                    Algorithm (FIFO BFS):
                      1. Sort all transactions chronologically
                      2. Seed deque with all outgoing txns from source_account_id
                      3. Early-exit if deque is empty (returns [])
                      4. BFS loop:
                           - Pop hop from deque left (FIFO order)
                           - Record hop: from, to, amount, timestamp, cumulative, latency
                           - If hop_number < max_hops AND dest not yet reached:
                               → Enqueue next outgoing txns from current "to" account
                                 (filtering: not already visited txn_id, amount >= min_amount)
                           - If destination_account_id set AND reached → stop
                    Returns: List[Dict] hop records

UI:
  FollowMoneyController receives FollowMoneyResponse
  → Renders hop cards
  → Calls prop setHighlightedHop() / setFollowMoneyPath() on parent InvestigationGraph
     → InvestigationGraph highlights matching nodes/edges in React Flow state
```

---

## AI Assistant (Grounded Copilot)

```
AIAssistantPanel (apps/web/src/components/ai/AIAssistantPanel.tsx)
  └─ User submits question → api.askAssistant(id, question)
       └─ POST /investigations/:id/ask
            └─ ask_assistant()
                 ├─ DB: Investigation → 404 if not found
                 ├─ context_builder.build_investigation_context(id, db)
                 │    ├─ DB: InvestigationEntity, Account, Transaction, Device, AccountDevice, CaseNote
                 │    ├─ DetectionEngine.run_all(...)
                 │    ├─ RiskScoringEngine.calculate_risk(patterns)
                 │    ├─ follow_the_money(accounts[0].id, transactions, max_hops=5)
                 │    └─ Returns: structured Dict (case_title, risk_score, entities,
                 │                shared_devices, detected_patterns, money_trail_hops,
                 │                sample_transactions, investigator_notes)
                 └─ ai_service.ask_investigation_assistant(question, context, client_id=IP)
                      ├─ check_rate_limit(client_id)
                      │    ├─ > 10 req/60s → return rate-limit error response (no Groq call)
                      │    └─ OK → append timestamp to sliding window
                      ├─ If no AI_API_KEY or key is placeholder:
                      │    └─ deterministic_offline_fallback(question, context)
                      │         ├─ Keyword match on question (why/evidence / money/trail / device / else)
                      │         └─ Returns formatted Markdown from context data
                      ├─ Else: Groq API call
                      │    ├─ client.chat.completions.create(model, [system_prompt, user_content])
                      │    │    system_prompt: strict grounding rules (answer only from JSON context)
                      │    │    user_content:  JSON.dumps(context) + question
                      │    ├─ Extract citation txn IDs (pattern.transaction_ids ∩ answer_text)
                      │    └─ Returns: {answer, grounded, model, citations, fallback_used:false}
                      └─ On exception → deterministic_offline_fallback (same as no-key path)
                           Returns: {answer, grounded, model:"deterministic-fallback", fallback_used:true}
```

**Non-obvious:** `build_investigation_context()` runs the **full analytics pipeline a second
time** (DetectionEngine + RiskScoringEngine + follow_the_money) independently from the main
detail endpoint — results are not shared. This is intentional for isolation but doubles the
DB read + compute work on `/ask` requests.

**Frontend Badge:** `AIAssistantPanel` inspects the most recent assistant response's `fallback_used`
flag: if `fallback_used === false`, renders green "Grounded" badge; if `true` (or initial), renders
amber "Offline Deterministic Mode" badge with `AlertTriangle`.

---

## Status Update & Audit Trail

```
Case dossier status dropdown
  └─ handleStatusChange(newStatus)
       └─ api.updateStatus(id, newStatus, userId)
            └─ PATCH /investigations/:id/status
                 └─ update_investigation_status()
                      ├─ DB: Investigation → 404 if not found
                      ├─ inv.status = req.status
                      ├─ inv.updated_at = datetime.utcnow()  ← note: still naive UTC here
                      ├─ DB: resolve User (fallback to first user in DB)
                      ├─ DB: INSERT CaseAction(id, investigation_id, user_id,
                      │                        action_type="status_change",
                      │                        previous_value, new_value, created_at)
                      └─ Returns: {investigation_id, previous_status, new_status, updated_at}

Frontend:
  handleStatusChange → setDetail(prev => {...prev, status: newStatus})  (optimistic local update)
  Detail re-fetch is NOT triggered automatically — status shown immediately via local state.
```

---

## Add Case Note

```
Case dossier notes tab → form submit
  └─ handleAddNote(e)
       └─ api.addNote(id, noteText, userId)
            └─ POST /investigations/:id/notes
                 └─ add_case_note()
                      ├─ DB: Investigation → 404 if not found
                      ├─ DB: resolve User (fallback to first user in DB)
                      ├─ INSERT CaseNote(
                      │      id="note_{unix_ms}",
                      │      created_at=datetime.now(timezone.utc)   ← timezone-aware UTC
                      │  )
                      └─ Returns: CaseNoteResponse

Frontend:
  On success → api.getInvestigationDetail(id) called via fetchData()
  → Full page re-fetch (notes feed refreshed from server)
  Timestamp rendered via formatISTDateTime(n.created_at) in IST.
```

---

## Compliance Report Page

```
/investigations/:id/report  (apps/web/src/app/investigations/[id]/report/page.tsx)
  └─ useEffect → api.getInvestigationReport(id)
       └─ GET /investigations/:id/report
            └─ generate_investigation_report()
                 ├─ DB: Investigation → 404 if not found
                 ├─ _compute_investigation_analytics()
                 ├─ DB: CaseNote, CaseAction  (ordered asc)
                 ├─ follow_the_money(accounts[0].id, transactions, max_hops=5)
                 │    (⚠️ called again independently — not reused from analytics)
                 ├─ Determines recommended_action based on composite_score threshold (>= 80)
                 └─ Returns: InvestigationReportResponse (10 regulatory sections)

Renders:
  Static HTML structured into 10 sections.
  "Print Report" button → window.print()  → @media print CSS activates.
```

---

## Data Flow: Analytics Engine (Internal)

```
_compute_investigation_analytics(inv, db)   [called by detail, list, timeline, follow-money, report]
  ├─ DB reads:
  │    InvestigationEntity → account_ids
  │    Account.filter(id.in_(account_ids))
  │    Transaction.filter(src/dst in account_ids AND within time_window).order_by(timestamp.asc)
  │    AccountDevice.filter(account_id.in_(account_ids))
  │    Device.filter(id.in_(device_ids))
  ├─ DetectionEngine.run_all(transactions, accounts, devices, account_devices)
  │    ├─ detect_fan_out(transactions, accounts, ...)
  │    ├─ detect_fan_in(transactions, accounts, ...)
  │    ├─ detect_rapid_pass_through(transactions, ...)
  │    ├─ detect_fragmentation(transactions, ...)
  │    ├─ detect_velocity(transactions, accounts, ...)
  │    ├─ detect_circular_movement(transactions, ...)
  │    ├─ detect_shared_device(transactions, accounts, devices, account_devices)
  │    └─ detect_new_intermediary(transactions, accounts, ...)
  │    Each returns List[PatternResult] or [] — exceptions caught per-detector.
  └─ RiskScoringEngine.calculate_risk(patterns)
       ├─ Maps patterns to 6 weighted categories (Velocity, Graph, Temporal,
       │   Fragmentation, Circular, Entity Reuse)
       ├─ Single-signal guard rail: isolated heuristics capped at 60/100
       └─ Returns RiskBreakdown(composite_score, risk_level, signals, reasons)
```

---

## Short Code Resolution (Frontend)

```
Any component needing to display an entity reference:
  └─ formatAccountCode(rawId)   /  formatEntityCode(rawId, type?)
     /  formatTxnCode(rawId)  /  formatCaseCode(rawId)
          └─ formatters.ts
               ├─ KNOWN_CODES[rawId]?  → return directly (explicit registry, guaranteed stable)
               └─ Else: hash-based fallback
                    ├─ hashCode(rawId)  → 32-bit unsigned integer
                    ├─ bucket = (hashCode % 900) + 100   → 3-digit number
                    ├─ Prefix determined by id prefix (acc_→ACC, ent_person→PER,
                    │   ent_merch→MER, ent_ben→BEN, dev_/fp_→DEV, txn_→TXN, inv_→TF, etc.)
                    └─ Returns e.g. "ACC-347" (stable for same rawId, no collisions within type)

humanizeEvidenceText(text, entities):
  └─ Replaces all acc_xxx occurrences with "HolderName (ACC-XX)"
     Replaces all txn_xxx occurrences with "TXN-XXX"
     Used in evidence locker descriptions.

formatISTDateTime(dateInput):
  └─ If string without Z or offset → append "Z" (assume UTC)
     new Date(normalized_string)
     → toLocaleString("en-IN", {timeZone: "Asia/Kolkata", ...})
     Returns: e.g. "3 Sept 2026, 12:40:56 am"
```

---

## Theme Persistence & Hydration Flow (Dark / Light Mode)

```
Initial Page Load (Anti-FOUC):
  └─ Inline blocking <script> in <head> (layout.tsx)
       ├─ Reads localStorage.getItem("tracefuse_theme")
       ├─ Fallback: window.matchMedia("(prefers-color-scheme: dark)").matches
       ├─ If dark → document.documentElement.classList.add("dark")
       └─ If light → document.documentElement.classList.remove("dark")
       (Executes synchronously before initial body render to prevent white flash)

Interactive Theme Toggle:
  └─ <ThemeToggle /> clicked in Navbar or /login
       ├─ Reads current document.documentElement.classList.contains("dark")
       ├─ Toggles: newTheme = isDark ? "light" : "dark"
       ├─ Updates DOM: classList.toggle("dark")
       ├─ Persists: localStorage.setItem("tracefuse_theme", newTheme)
       ├─ Dispatches: window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme } }))
       └─ Component states and CSS variables (--background, --surface, --text-primary)
          instantly transition via Tailwind class-based styles.
```
