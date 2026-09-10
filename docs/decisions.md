# TraceFuse — Architecture Decision Record (ADR)

Chronological log of every meaningful technical and design decision made during development.
Append a new entry after every future change that involves a real tradeoff or choice.

---

## Python + FastAPI for the backend (not Node/Express or Django)
**Commit:** `2bc765e2` · 2026-08-30

**Rationale:** The analytics layer (graph algorithms, pattern detectors, risk scorer, temporal
analysis) is pure Python and relies on NetworkX, pandas, numpy, and (optionally) Groq's Python SDK.
Keeping the API in the same runtime avoids a serialization boundary between the Python
analytics engine and the web server, and FastAPI's async-by-default design and automatic
OpenAPI schema generation kept the contract with the TypeScript frontend explicit and validated.

**Alternative(s) considered:** Node/Express (natural fit for the Next.js ecosystem), Django
REST Framework (more batteries, heavier).

**Tradeoff accepted:** Two separate runtimes must be deployed and kept running concurrently
(Python API + Node frontend). CORS handling and two separate `package.json` / `requirements.txt`
dependency trees add operational overhead.

---

## Next.js (App Router) for the frontend (not plain React + Vite)
**Commit:** `2bc765e2` · 2026-08-30

**Rationale:** App Router enables per-route page titles, React Server Components for static
pages, and — critically — **edge middleware** for session-cookie-based route protection without
shipping auth logic to the browser. The `/investigations/[id]` dynamic route is automatically
code-split. The `cache: "no-store"` flag in the fetch wrapper prevents stale data in the
investigation views.

**Alternative(s) considered:** Vite + React SPA (simpler DX), Create React App (end-of-life).

**Tradeoff accepted:** App Router's `"use client"` / `"use server"` mental model adds cognitive
overhead. All data-fetching pages are fully client-side (`"use client"`) because investigation
data is dynamic and user-specific, giving up SSR cache benefits.

---

## SQLAlchemy ORM with PostgreSQL primary / SQLite fallback
**Commit:** `2bc765e2` · 2026-08-30

**Rationale:** Using SQLAlchemy ORM abstracts the DB connection string so that the local
developer workflow uses SQLite (zero infra required) while staging and production point at
a Supabase PostgreSQL instance by changing only `DATABASE_URL` in `.env`. All schema
migrations are handled by `init_db()` on startup (SQLAlchemy `create_all`).

**Alternative(s) considered:** Prisma (great for Node but adds a Python interop layer),
raw psycopg2 (more control, no ORM benefits).

**Tradeoff accepted:** `create_all` is not a migration tool — schema changes require a manual
drop-and-recreate. Production schema evolution will need Alembic or equivalent if the schema
changes beyond the hackathon.

---

## Monorepo with npm workspaces + `packages/shared` for shared TypeScript types
**Commit:** `2bc765e2` · 2026-08-30

**Rationale:** Both the API schemas (Pydantic) and the frontend types (TypeScript) must stay
in sync. A `@tracefuse/shared` workspace package containing TypeScript interfaces mirroring
every FastAPI response model ensures the frontend never references an API field that doesn't
exist. The single-repo layout also makes it trivial to run `npm --workspace=apps/web run dev`
from the root.

**Alternative(s) considered:** Separate repos with an OpenAPI code-gen step, manual type
duplication per service.

**Tradeoff accepted:** The shared package requires manual sync when Pydantic schemas change —
there is no automatic generation step from OpenAPI. This is acceptable for a hackathon
codebase but would need code-gen tooling in production.

---

## 8 independent pure-function pattern detectors orchestrated by a single DetectionEngine
**Commit:** `2bc765e2` · 2026-08-30

**Rationale:** Each AML pattern (fan-out, fan-in, rapid pass-through, fragmentation, velocity,
circular movement, shared device, new intermediary) is implemented as a standalone Python
function that takes raw lists of transactions, accounts, and devices and returns
`PatternResult[]`. The `DetectionEngine` class loops over all 8, collects results, and
catches per-detector exceptions so a bug in one detector never silences the others. All
thresholds are externalized to `analytics/patterns/config.py`.

**Alternative(s) considered:** A single monolithic detector function (simpler but untestable
in isolation), a rules-engine library (heavier dependency).

**Tradeoff accepted:** Every endpoint that needs analytics calls `DetectionEngine.run_all()`
and `RiskScoringEngine.calculate_risk()` on every request — there is no caching or
pre-computation. This is fast enough for a demo-scale dataset but would not scale to
thousands of concurrent investigators on production data without a background job layer.

---

## FIFO multi-hop Follow-the-Money using BFS (not DFS or shortest-path)
**Commit:** `d68122e3` · 2026-08-31

**Rationale:** A BFS approach with a deque processes outgoing hops in chronological order,
which matches the regulatory interpretation of "which funds went where first" (FIFO provenance).
Timestamps are enforced to be non-decreasing so the trace respects causality. A depth cap
(`max_hops`, default 6) prevents runaway traversal on circular graphs. The algorithm also
accepts optional `destination_account_id` and `min_amount` filters to scope the trace to
a specific investigation hypothesis.

**Alternative(s) considered:** DFS (can visit distant hops before near ones, breaking FIFO
semantics), shortest-path / Dijkstra (optimal for distance, not provenance attribution).

**Tradeoff accepted:** BFS explores all breadth-first paths up to `max_hops`; on a densely
connected graph this can return a very large hop list. The current implementation serializes
the first 6 hops in the report endpoint and up to the slider value in the UI — fine for the
demo dataset, would need pagination for production.

---

## Groq (llama-3.3-70b-versatile) as the AI provider (not OpenAI / Anthropic)
**Commit:** `187836f0` · 2026-08-31

**Rationale:** Groq provides the fastest LLM inference latency of any commercially available
provider (sub-500ms typical for 800-token responses) and has a free tier that covers the
hackathon evaluation period. The Groq Python SDK is API-compatible with OpenAI's interface,
so switching providers only requires changing `AI_BASE_URL` and `AI_MODEL` in `.env`.

**Alternative(s) considered:** OpenAI GPT-4o (more capable, higher cost, higher latency),
Anthropic Claude (similar cost/latency to OpenAI), local Ollama (zero cost but requires GPU).

**Tradeoff accepted:** Groq's free-tier rate limits are aggressive. The backend adds an
in-memory sliding-window rate limiter (10 requests/60 s per client IP) to stay within limits,
but this state is lost on server restart and does not survive horizontal scaling.

---

## Deterministic offline fallback for AI assistant (no crash on missing API key)
**Commit:** `187836f0` · 2026-08-31

**Rationale:** Judges evaluating the demo may not configure a Groq API key. If `AI_API_KEY`
is absent or the Groq call fails, `ask_investigation_assistant()` falls back to a rule-based
evidence synthesizer that reads the same structured JSON context and produces a formatted
Markdown answer — indistinguishable in structure from an LLM response. `fallback_used: true`
is returned so the UI can display a notice if desired.

**Alternative(s) considered:** Return a generic "AI unavailable" error (poor demo experience),
require API key as a mandatory dep (breaks offline evaluation).

**Tradeoff accepted:** The deterministic fallback uses simple keyword matching on the question
(`"why"`, `"money"`, `"device"`, etc.) and cannot handle arbitrary open-ended queries the way
the LLM can. Complex questions outside the keyword set fall through to a generic summary.

---

## Cookie-based session auth (not JWT, not NextAuth, not Supabase Auth)
**Commit:** `b4e4f50d` · 2026-08-30 / refined `620e18f0` · 2026-09-01

**Rationale:** For a hackathon demo the auth requirement is: prevent a judge from accidentally
viewing internal pages via direct URL, and provide a one-click bypass for rapid demo access.
A hard-coded passcode (`demo2026`) sets a `tracefuse_session=authenticated_analyst` cookie.
Next.js Edge Middleware reads this cookie on every request before any page renders, redirecting
unauthenticated users to `/login` with `?from=<path>` so they land back in the right place
after login.

**Alternative(s) considered:** NextAuth.js (full OAuth/credential flow, significant setup),
Supabase Auth (requires Supabase project and env vars), JWT signed tokens (stateless but
requires a signing secret and verification logic on every edge request).

**Tradeoff accepted:** The session value is a static string — not cryptographically signed.
Anyone who knows the cookie value can bypass the gate. This is acceptable for a demo-only
deployment but is not production-grade auth. Full RBAC, per-analyst session tokens, and audit
logs would be required before real deployment.

---

## Compliance report as a printable browser page (not a server-generated PDF)
**Commit:** `50b5b58e` · 2026-08-31

**Rationale:** Browser `window.print()` with `@media print` CSS is zero-dependency — no
WeasyPrint, ReportLab, or Puppeteer binary needed. The report route
(`/investigations/:id/report`) renders all 10 regulatory sections in a structured HTML layout;
the investigator triggers browser print-to-PDF directly.

**Alternative(s) considered:** Server-side PDF with WeasyPrint/ReportLab (true PDF, more
portable, harder to deploy), React PDF library (client-side canvas, layout limitations).

**Tradeoff accepted:** Print layout is browser-engine-dependent. Chrome/Edge produce clean
PDFs; Firefox may have minor page-break differences. Headers, footers, and multi-column print
layouts are limited by CSS `@media print` support.

---

## Vercel (frontend) + Render (backend) split deployment
**Commit:** `cba53218` · 2026-08-31

**Rationale:** Vercel provides instant Next.js edge-optimized hosting with zero config and
automatic preview deployments. Render provides managed Python containers with a simple
`render.yaml` blueprint and direct environment variable injection. Both have free tiers
suitable for a hackathon.

**Alternative(s) considered:** Railway (similar), single Heroku dyno via `Procfile` (included
as backup), Docker Compose on a VPS (more control, more ops).

**Tradeoff accepted:** Cross-origin API calls require CORS (`allow_origins=["*"]` for the demo).
In production this should be restricted to the Vercel deployment URL. `NEXT_PUBLIC_API_URL` on
Vercel must be set manually after the Render service is deployed.

---

## Design system: linen/cream background + navy accent (not dark terminal theme)
**Commit:** `da7abf26` · 2026-08-31 / revised `fe1e464b` · 2026-08-31

**Rationale:** An initial dark terminal aesthetic was explored but the team converged on a light
`linen` warm-white background with deep navy accents and Fraunces serif headings paired with
Inter sans-serif body. This palette reads as "institutional financial compliance tool" rather
than "hacker terminal," better aligned with the FIU/compliance officer audience.

**Alternative(s) considered:** Pure dark mode terminal (explored, reverted), standard blue/white
bank portal look (too generic).

**Tradeoff accepted:** Light backgrounds show graph canvas grid lines and node cards cleanly
but make subtle color distinctions between risk levels harder in low-contrast environments.

---

## TF-XXX / ACC-XX / PER-XX / DEV-XX centralized short codes replacing all raw IDs
**Commit:** `eda1409b` · 2026-09-01 / centralized `18eaf4e2`, `7ca8631a` · 2026-09-02–03

**Rationale:** Raw internal IDs like `inv_flagship_demo`, `acc_flagship_origin`,
`fp_flagship_syndicate_core_88x` surfaced throughout the UI. A centralized `formatters.ts`
module provides a single source of truth with: (a) an explicit `KNOWN_CODES` registry for all
seeded flagship records ensuring collision-free stable codes, and (b) a deterministic
hash-based fallback for unseen IDs that is type-scoped to prevent cross-type collisions.
Distinct prefixes: `TF-` (cases), `ACC-` (accounts), `PER-` (persons), `MER-` (merchants),
`BEN-` (beneficiaries), `DEV-` (devices), `TXN-` (transactions), `REL-` (relationships).

**Alternative(s) considered:** Display names only without codes (loses traceability), numeric
auto-increment in DB (requires migration, changes IDs on re-seed).

**Tradeoff accepted:** The `KNOWN_CODES` registry must be manually updated when new seed
entities are added. The hash fallback generates non-sequential codes (e.g. `ACC-47`) that
may look arbitrary.

---

## UTC storage + IST frontend display for all timestamps
**Commit:** post-history fix, `7ca8631a` · 2026-09-03

**Rationale:** Python's `datetime.utcnow()` produces naive datetimes serialized by FastAPI
without a `Z` suffix. JavaScript's `new Date()` parses bare ISO strings as local time, causing
timestamps to display 5 h 30 min in the past for IST users. Fix: (1) backend switched to
`datetime.now(timezone.utc)` so the serialized string carries the `+00:00` offset; (2)
`formatISTDateTime()` helper in `formatters.ts` appends `Z` to any bare ISO string before
constructing a `Date`, then formats using `timeZone: "Asia/Kolkata"`.

**Alternative(s) considered:** Store timestamps in IST natively (non-standard, breaks interop),
use moment-timezone (unnecessary dependency when `Intl` covers this).

**Tradeoff accepted:** Audit trail, timeline, and compliance report timestamps still use the old
`toLocaleString()` — cataloged for a follow-up pass.

---

## Device nodes: "Shared Device" friendly label, suppress all raw fp_ strings
**Commit:** `18eaf4e2` · 2026-09-02

**Rationale:** Devices have no human `name` field — only a long opaque fingerprint string.
Displaying this (even truncated) as primary text in graph node cards violated the no-raw-ID
rule. Nodes now show `"Shared Device"` as primary text and `DEV-XX` as secondary, with all
`fp_` strings fully suppressed from visible text.

**Alternative(s) considered:** Device type + short code label (e.g. "Mobile DEV-01").

**Tradeoff accepted:** "Shared Device" is generic — does not differentiate mobile vs. desktop
fingerprints. Device type metadata exists in DB but was omitted to keep node cards compact.

---

## Non-monetary edges: suppress ₹0 pill, render as muted dashed strokes
**Commit:** `18eaf4e2` · 2026-09-02

**Rationale:** Structural relationship edges (`owns`, `uses-device`, `linked-to`) were rendered
by `TransactionEdge` the same as financial edges, producing a `₹0` bubble that implied a
zero-rupee transfer. The component now checks `edge_type` and suppresses the amount pill for
relationship edges, rendering them as muted dashed strokes with a type label instead.

**Alternative(s) considered:** Separate edge component for relationship vs. transaction edges
(cleaner separation, larger refactor).

**Tradeoff accepted:** `TransactionEdge` handles two distinct visual modes in one component,
adding conditional branching while keeping the edge-type registry simple.

---

## Server-side JWT authentication & HttpOnly cookie session architecture (replacing frontend-only gating)
**Commit:** post-history update · 2026-09-09

**Rationale:** The initial authentication mechanism was solely a Next.js edge middleware gate checking
a static `tracefuse_session=authenticated_analyst` cookie. The FastAPI backend performed zero independent
credential verification, allowing unauthenticated direct API requests to access and mutate forensic data.
The architecture was upgraded:
1. `POST /auth/login` on FastAPI validates passcodes server-side against `DEMO_PASSCODE` (or `ADMIN_PASSCODE`)
   and issues a signed JWT (HS256, 12h expiry, secret from `JWT_SECRET` env var).
2. A single reusable FastAPI dependency (`verify_session_token`) verifies the token on every data retrieval
   and mutating endpoint, returning `401 Unauthorized` for missing/invalid/expired tokens.
3. Tokens are transmitted and stored strictly via `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`tracefuse_jwt`),
   completely preventing access by client-side JavaScript or localStorage.
4. Next.js App Router Route Handlers (`/api/auth/demo-login`, `/api/auth/login`, `/api/auth/logout`) execute
   server-to-server calls to FastAPI, removing all hardcoded `"demo2026"` passcodes and `"Priya Sharma"`
   references from client-side bundles while preserving the zero-friction, 1-click judge demo flow.
5. Removed `useSearchParams()` and `<Suspense>` from `/login`, reading redirect targets via `window.location.search`
   on submit so the login form renders directly in SSR without "Loading Auth Gate..." fallback delays; added
   guarded 401 auto-redirect in `fetchJson` so expired sessions cleanly redirect to `/login` without looping.

**Alternative(s) considered:** Full Role-Based Access Control (RBAC) with multi-role permissions tables
(excessive complexity for demo scope), localStorage + Authorization Bearer header from client JS (vulnerable
to XSS, violates security specs), basic HTTP auth (poor UX and cookie coordination).

**Tradeoff accepted:** Single authenticated "analyst" role without granular multi-tenant permission layers;
CORS middleware explicitly allows origin credentials rather than wildcard origins.

---

## Application-wide class-based dark mode design system & anti-FOUC hydration
**Commit:** post-history update · 2026-09-09

**Rationale:** Financial crime investigators frequently conduct multi-hour surveillance and network graph
analysis in low-light environments. Adding a native dark mode required preserving the curated warm parchment /
deep navy identity while providing a sleek high-contrast dark palette without breaking existing semantic tokens
or graph rendering.
1. Enabled `darkMode: 'class'` in Tailwind config.
2. Mapped design system colors (canvas `#0B0F17`, surface `#131B26`, border `#223042`, text `#F1F5F9` / `#94A3B8`,
   accent `#3874CB`, critical `#EF4444`, suspicious `#F59E0B`, normal `#94A3B8`) through CSS variable RGB triples
   (`--surface-rgb: 19 27 38`), enabling Tailwind alpha modifiers (`bg-surface/95`, `border-navy/20`) to work seamlessly
   across both themes.
3. Implemented an anti-FOUC (flash of unstyled content) blocking script in `<head>` that reads `localStorage.getItem('tracefuse_theme')`
   (falling back to `window.matchMedia('(prefers-color-scheme: dark)')`) and sets `document.documentElement.classList.add('dark')`
   before initial body paint.
4. Created `<ThemeToggle />` component with Sun/Moon icons in the top navigation bar and on `/login`, persisting
   user preference in `localStorage` and dispatching custom `themechange` events.
5. Converted React Flow canvas styling (background dot grid, node card containers, edge stroke contrast, controls, minimap)
   and Recharts `<XAxis />`, `<YAxis />`, `<Tooltip />` to dynamic CSS variables, ensuring 100% theme consistency.

**Alternative(s) considered:** Media query `prefers-color-scheme`-only (removes user control and toggle button),
separate dark Tailwind utility classes on every single element (`dark:bg-slate-900 dark:text-white`) without CSS variables
(leads to inconsistent hex colors and unmaintainable component overrides), CSS `filter: invert(1)` (breaks image/graph colors).

**Tradeoff accepted:** CSS variables require defining RGB triples in `globals.css` for alpha channel support;
accepted for perfect color family preservation and instant theme switching.

---

## Dynamic AI Copilot mode indicator (replacing static "Grounded" badge)
**Commit:** post-history update · 2026-09-10

**Rationale:** The AI Copilot panel previously rendered a static green "Grounded" badge in its header
regardless of whether a live LLM response was generated or the deterministic offline fallback engine was used.
This was misleading when running without a valid external LLM connection. The badge was updated to dynamically
inspect the latest assistant response's `fallback_used` field:
1. Displays green "Grounded" (`CheckCircle2`) strictly when a live LLM completion succeeded (`fallback_used === false`).
2. Displays amber "Offline Deterministic Mode" (`AlertTriangle`) whenever the deterministic offline fallback engine
   was invoked (due to missing API key, rate limits, or external provider model errors).

**Alternative(s) considered:** Static text label without badge pill (reduces visual clarity), hiding badge entirely
when offline (obscures engine transparency from investigators).

**Tradeoff accepted:** Header status reflects the outcome of the most recent response rather than polling backend
health proactively; avoids extraneous background health-check network requests.

---

## Cross-Origin SameSite=None JWT cookie & infinite reload loop prevention
**Commit:** post-history update · 2026-09-10

**Rationale:** When deploying the frontend on Vercel (`https://tracefuse.vercel.app`) and backend on Render
(`https://<api>.onrender.com`), requests between them are cross-origin and cross-site.
1. **Cross-Site Cookies:** Modern browsers reject `SameSite=Lax` cookies on cross-site asynchronous fetch requests.
   Updated FastAPI's `response.set_cookie` to strictly specify `samesite="none"` and `secure=True`, allowing
   browsers to persist and transmit `tracefuse_jwt` cross-origin.
2. **Direct Cross-Origin Cookie Exchange:** Updated the frontend `login` and `demoLogin` methods to authenticate
   directly against the backend API with `credentials: "include"`, ensuring the browser receives and stores the
   cross-origin cookie on the backend domain while also establishing the local Next.js route gating cookie.
3. **CORS Credentials:** Explicitly added `https://tracefuse.vercel.app` to FastAPI's `allowed_origins` list alongside
   support for `CORS_ORIGINS` and `ALLOWED_ORIGINS` environment variables, ensuring compliant preflight headers
   without using wildcard `allow_origins=["*"]`.
4. **Infinite Reload Loop Prevention:** Guarded `fetchJson` on 401 errors using `sessionStorage` and cleared local
   frontend cookies before redirecting to `/login?expired=true`. Next.js middleware was updated to exempt requests
   with `expired=true`, preventing a ping-pong redirect loop between frontend middleware and the client API layer.
   Dashboard error handling now halts loading and displays a manual retry/sign-in interface on failure.

**Alternative(s) considered:** Storing JWT in `localStorage` or memory and sending `Authorization: Bearer` headers
(violates the strict HttpOnly cookie architecture constraint), Next.js API proxy for all backend traffic (adds latency
and double data transfer overhead across Vercel serverless functions).

**Tradeoff accepted:** `SameSite=None` cookies require `Secure=True` (HTTPS), which is natively satisfied in
production on Vercel and Render.

---

## React Flow edge label overlay pills & node background reset
**Commit:** post-history update · 2026-09-10

**Rationale:** On the investigation graph canvas, edge labels and node layering were calibrated for dark mode:
1. **Edge Labels Stacking Context:** Transaction amounts are wrapped in an opaque, high-contrast dark pill (`bg-[#0a0d14] border-slate-700 text-slate-200 text-xs font-mono`). To ensure edge labels never render over nodes and obscure entity names, edge label containers are calibrated to `z-index: 10`, while `.react-flow__nodes` and node components (`AccountNode`, `DeviceNode`, `EntityNode`) are elevated with `relative z-40` and solid backgrounds (`bg-[#0a0d14]`).
2. **Node Wrapper White Box Defect:** When nodes were rendered or selected, a stark white rectangular box bled out from behind custom cards due to `@xyflow/react`'s default `.react-flow__node-default` styles (`background: #fff; padding: 10px`). Overrode `.react-flow__node`, `.react-flow__node-default`, and related wrappers in `globals.css` with `background: transparent !important`, `padding: 0 !important`, and `box-shadow: none !important`. Selected states apply `ring-2 ring-indigo-500`.
3. **Vertical & Horizontal Tier Spacing:** In `analytics/graph/builder.py`, increased node grid spacing from `160px` to `220px` vertical rank separation and `220px` to `260px` horizontal spacing, providing ample breathing room for curved transaction edges and labels without crowding adjacent nodes.

**Alternative(s) considered:** Setting node types to empty strings (breaks type-based edge connection logic), SVG `<text>`
labels with SVG `<rect>` backgrounds (lacks flexbox padding, font metrics differ across browsers).

**Tradeoff accepted:** Solid `#0a0d14` node background completely masks edges routed directly behind the card, requiring curved bezier paths around nodes; accepted because node text clarity and hierarchy must be preserved.
