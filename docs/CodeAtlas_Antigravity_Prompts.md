# CodeAtlas — Antigravity Build Prompts (MVP/Hackathon Edition)

*Updated: 0.3 now reflects the revised UI/UX design methodology
(open color/font choice, light-theme-only, content-first, resource-
library-informed motion — no more fixed hex/font spec). A one-time
retrofit prompt (3.3b) is included since you've already built through
3.3 under the old spec.*

Run in order: **0.1 → 0.4** (pin as persistent context), then 1.1 onward.
This edition is deliberately infra-light for hackathon speed:
**no Kubernetes, RabbitMQ, MinIO, API Gateway, or Redis in the MVP** —
one FastAPI backend, Postgres + Neo4j, in-process background jobs. It
adds an explicit **Domain Inference** stage, a **shared Confidence/
Evidence model with a hard never-guess rule**, and a **Benchmark &
Evaluation phase (4.5)** that gates "MVP complete." Heavier infra moves
to Appendix A.2 for later.

---

## PHASE 0 — Global Context (pin these 4, run once)

### 0.1 Product & Scope
```
Persistent context. CodeAtlas = AI Software Reasoning Engine: reconstructs
architecture, business capabilities, user journeys, and logic gaps from
source repos (not a code generator/assistant — differentiator vs Copilot/
Cursor/Sourcegraph/CodeSee is business-level reasoning). Being built as a
hackathon MVP: prioritize a correct, evidence-grounded pipeline over
infra robustness.

Core pipeline: Upload → Parse → AST/Metadata → Knowledge Graph → Domain
Inference → Capability Intelligence / Journey Reconstruction / Logic Gap
Detection → Dashboard → Export.

Personas: New Developer, Senior Architect, Engineering Manager, CTO/
Product Owner.

FRs (build all): FR-01 Repo Upload, FR-02 Git Import, FR-03 Parsing,
FR-04 Knowledge Graph, FR-05 Capability Detection, FR-06 Journey
Reconstruction, FR-07 Logic Gap Detection, FR-08 Dashboard, FR-09
Explainable AI, FR-10 Export Reports.

MoSCoW: Must=Upload/Parsing/KG/Reasoning/Dashboard. Should=Collaboration,
Report export. Could=Multi-language. Won't(MVP)=IDE plugins, live editing.

NFRs: full analysis <5 min for medium repo; explainable — every AI claim
must be traceable to evidence, never asserted without it.

MVP language scope ONLY: React, Next.js, Node.js, Express, relational DBs.
Everything else is future scope.

Roles (RBAC, enforce everywhere): Admin, Organization Owner, Developer,
Viewer.

Acknowledge, then wait for 0.2.
```

### 0.2 Simplified MVP Tech Stack & Architecture
```
Persistent context (continues 0.1).

Stack: Frontend Next.js+React+TS+Tailwind. Backend: ONE FastAPI monolith
(Python) — do not split into microservices unless a specific module
proves during the hackathon that it genuinely needs isolation; default is
a single deployable service with clean internal module boundaries.
Databases: PostgreSQL (relational) + Neo4j (knowledge graph) only.

Explicitly OUT of MVP infra (do not stand these up now — see Appendix
A.2 for when/why to add them later): Kubernetes, RabbitMQ, MinIO/S3,
API Gateway, Redis.

Job processing (replaces RabbitMQ for MVP): FastAPI BackgroundTasks /
an in-process async job runner. AnalysisJobs.status is the single source
of truth for pipeline stage (Queued/Running per-stage/Completed/Failed)
— no external queue needed.

File storage (replaces MinIO for MVP): local filesystem under a
workspace directory, behind a small storage-adapter interface so it can
be swapped for S3-compatible storage later without touching business
logic.

Deployment path (MVP): Client → Next.js frontend → FastAPI backend
(direct call, or Next.js route proxy) → PostgreSQL/Neo4j → local
storage. No CDN/load balancer/gateway required for MVP.

Monorepo layout:
frontend/
backend/
  api/ auth/ repositories/ parser/ knowledge_graph/ reasoning_engine/
  reports/ database/ middleware/ models/ workers/ tests/ config/
database/
docs/
tests/
(Keep parser/knowledge_graph/reasoning_engine as MODULES inside backend/,
not separate services — this is a monolith by design for the hackathon.)

Standards: ESLint(TS), Black(Python), Prettier, Conventional Commits,
SOLID.

Security baseline: HTTPS, AES-256 at rest, JWT auth, input validation,
parameterized queries only, in-process rate limiting (e.g. slowapi —
no gateway needed), secrets via .env/secret store (not hardcoded), audit
logs, RBAC on every endpoint.

Acknowledge, then wait for 0.3.
```

### 0.3 Design System & Screen/Component Standards (v2 — updated)
```
Persistent context (continues 0.1–0.2). REPLACES the earlier fixed-token
design spec — do not reuse old hex codes (#2563EB etc.) or the old font
trio (Space Grotesk/Manrope/DM Sans) as hard requirements; they're now
illustrative only, not mandatory. See 3.3b for retrofitting screens built
under the old spec.

Act as a Senior Product Designer + Design System Expert. Design
content-first: for every screen, settle information hierarchy, user
flow, navigation, section organization, and content grouping BEFORE any
color/font/styling decision.

Theme: LIGHT THEME ONLY, always. Never generate dark UI, black-heavy
layouts, dark cards, or dark sections unless explicitly requested later.

Design system to define (as CSS variables/design tokens, kept
consistent app-wide once chosen — pick and lock these once, don't
re-derive per screen):
- Primary, Secondary, Accent, Background, Surface, Card, Border,
  Success, Warning, Error, Info colors.
- Light-theme rules: white/soft-neutral background, elevated light
  cards, highly readable dark typography, strong-but-elegant accents,
  strong contrast/accessibility. Never: dark UI, black-heavy layouts,
  random colors, gray-on-gray.
- Typography: choose a premium, distinctive font pairing — explicitly
  AVOID Arial, Inter, Roboto, or generic system fonts. Define Display
  Heading, H1, H2, H3, Body, Caption, Labels, Buttons with consistent
  spacing/rhythm.
- Visual language: icons, shapes, dividers, illustrations, background
  elements, patterns, shadows — every one must improve usability or
  storytelling; never decorate for decoration's sake.
- Layout: 8-point spacing system; optimize alignment, margins, padding,
  white space, grid, visual weight, component spacing, balance.
- Backgrounds: avoid flat white — use soft gradients, layered
  backgrounds, subtle textures, light geometric patterns, soft shadows
  to add depth while staying minimal.
- Motion: smooth page transitions, hover animations, section reveals,
  meaningful micro-interactions — motion must guide attention, not
  distract.
- Final polish pass required before any screen is "done": accessibility,
  contrast, responsiveness, consistency, readability, brand harmony
  (WCAG 2.1 AA, keyboard nav, screen reader labels, focus indicators,
  semantic HTML — non-negotiable on every screen).

Explicitly avoid a generic AI-generated look: no generic SaaS dashboard
clichés, no purple-gradient websites, no cookie-cutter landing pages, no
predictable component layouts. The product must feel intentionally
designed, like a senior team spent weeks on it.

Design resource inspiration — draw on these intelligently and combine
them into one cohesive interface (never copy full pages, never look
like a stitched-together kit collection): ReactBits (interactive
components), GSAP (premium transitions/scroll animation), Anime.js
(micro-interactions), Glass3D (tasteful glassmorphism/3D), Open Doodles
(friendly illustrations), CTA Gallery (high-converting CTA patterns),
Watermelon UI / Skiper UI / Hallmark UI / Unlumen UI (layout/component/
interaction inspiration).

Component-selection intelligence — before adding ANY component/
animation/pattern, ask: does it improve usability, visual hierarchy,
premium feel, fit for CodeAtlas's personality (developer tool: emphasize
speed/clarity/precision over decoration), and user experience? Only
include it if yes on all counts. Consider product category, persona,
user goal, screen purpose, business objective, accessibility,
performance, responsiveness, brand personality, emotional impact for
every decision.

RULE for every screen in any later prompt (unchanged, still mandatory):
Screen Name, Purpose, User Goal, Layout Structure, Components, Actions,
Navigation, Empty State (illustration+CTA), Loading State (skeleton),
Success State, Error State (actionable+retry), Validation Rules. Never
skip this.

Component specification required for: Navbar, Sidebar, Footer, Cards,
Tables, Forms, Inputs, Dropdowns, Modals, Drawers, Buttons, Tabs,
Pagination, Search, Filters, Charts, Toasts, Notifications, Avatars,
Badges, Tooltips.

Responsive design required for Desktop, Laptop, Tablet, Mobile — define
behavior per major screen (exact breakpoints/grid are a design decision
to make and lock during 1.2/2.1, not dictated here).

16-screen inventory: Landing, Login, Register, Dashboard, Repo Upload,
Upload Progress, Analysis Dashboard, Capability Explorer, Journey
Explorer, Logic Gap Explorer, Repo History, Reports, Settings, Profile,
Org Management, Admin Dashboard.

Final bar: the UI should read as modern, premium, light-themed, minimal,
creative, professional, elegant, user-friendly, highly polished,
memorable — comparable to Linear, Stripe, Apple, Notion, Figma, Airbnb,
or Framer. Not a generic AI-generated interface.

Acknowledge, then wait for 0.4.
```

### 0.4 Confidence/Evidence Model & Never-Guess Rule
```
Persistent context (continues 0.1–0.3). This is the shared contract used
by Domain Inference (3.5), Capability Intelligence (4.1), Journey
Reconstruction (4.2), Logic Gap Detection (4.3), and the Benchmark phase
(4.5). Define it now, in backend/models/, before any detector is built.

Shared schema:
Evidence { evidence_id, source_type: file|route|db_table|graph_node,
reference: <path or node id>, snippet_or_description }
Finding { finding_id, category, confidence_score: float 0–1,
reasoning_summary: str, evidence: list[Evidence], status:
Confirmed|Low-Confidence|Insufficient-Evidence }

Confidence bands: High ≥0.75 (multiple independent, direct evidence
items), Medium 0.5–0.74 (one direct or several indirect items), Low
<0.5 (weak/indirect only). Score must be computed from the evidence
count/directness, not guessed by the LLM in free text.

NEVER-GUESS RULE (hard requirement, enforce in code, not just prompting):
- If no evidence is found for a pattern, the engine must NOT fabricate a
  finding. Either omit it entirely, or emit status="Insufficient-Evidence"
  with confidence_score=0 and a reasoning_summary limited to "not enough
  signal found" — no invented specifics.
- Add an API-layer validation guard that REJECTS any Finding where
  confidence_score > 0 and evidence is empty. This must be a code-level
  check (e.g. a Pydantic validator), not just an LLM instruction.
- LLM prompts used by any detector must explicitly instruct: "Only
  report a finding if you can cite specific evidence. If uncertain,
  say so — do not guess."

Acknowledge. Ready for Phase 1.
```

---

## PHASE 1 — Planning

### 1.1 Requirements Doc
```
Phase 1. Write docs/requirements.md only — no code. Include: product
overview/problem/vision, goals, 4 personas w/ goals+pain points, full
FR/NFR list, MoSCoW table, RBAC roles, KPIs (completion rate,
time-to-insight, adoption, reasoning accuracy, retention), risks (bad
inference, unsupported langs, large repos, LLM cost, privacy),
constraints (MVP lang scope + simplified MVP infra per 0.2), competitive
diff, acceptance criteria, future scope (incl. infra scale-up per
Appendix A.2).
```

### 1.2 Architecture Doc
```
Phase 1. Write docs/architecture-overview.md only — no code. Include the
pipeline (Upload→Parse→KG→Domain Inference→Capability/Journey/Gap→
Dashboard→Export), the simplified MVP topology from 0.2, and this
Mermaid diagram:
flowchart TD
A[Upload Repository] --> B[Repository Parsing]
B --> C[Knowledge Graph]
C --> DI[Domain Inference]
DI --> D[Capability Intelligence]
DI --> F[Journey Reconstruction]
DI --> G[Logic Gap Detection]
D --> H[Interactive Dashboard]
F --> H
G --> H
H --> I[Export Report]
```

---

## PHASE 2 — Setup

### 2.1 Monorepo, Lint/Format, CI
```
Phase 2. Scaffold per 0.2's folder structure. Init Next.js+TS+Tailwind in
frontend/, FastAPI monolith in backend/. Configure ESLint, Prettier,
Black, commit-msg hook for Conventional Commits. GitHub Actions: lint →
unit tests → Docker build (frontend+backend images only — no registry/
K8s deploy step yet). docker-compose.yml for local dev: Postgres + Neo4j
only. No business logic yet.
```

### 2.2 Database Schema (PostgreSQL)
```
Phase 2. In database/, create migrations for:
Users(user_id PK)
Organizations(org_id PK)
Repositories(repo_id PK, organization_id FK->Organizations)
RepositoryFiles(file_id PK, repo_id FK->Repositories)
AnalysisJobs(job_id PK, repo_id FK->Repositories)  -- status field also
  drives the in-process job runner (2.3), no external queue
Capabilities(capability_id PK, job_id FK->AnalysisJobs)
UserJourneys(journey_id PK, job_id FK->AnalysisJobs)
LogicGaps(gap_id PK, job_id FK->AnalysisJobs)
KnowledgeGraphs(kg_id PK, job_id FK->AnalysisJobs)
DomainInferences(domain_id PK, job_id FK->AnalysisJobs)  -- NEW
Reports(report_id PK, job_id FK->AnalysisJobs)
AuditLogs(log_id PK)
Notifications(notification_id PK, user_id FK->Users)

Relationships: Org->Users 1:N, Org->Repositories 1:N, Repository->
AnalysisJobs 1:N, AnalysisJob->{Capabilities,UserJourneys,LogicGaps,
DomainInferences,Reports} 1:N each.
Capabilities/UserJourneys/LogicGaps/DomainInferences rows must store the
Finding/Evidence shape from 0.4 (evidence as JSONB column is fine).
Add ER diagram (Mermaid) to database/README.md. Validators: email
uniqueness, repo size limit, supported-language check, required job
metadata, JWT/role validation at API layer.
```

### 2.3 Neo4j Stub + In-Process Job Runner
```
Phase 2. Add Neo4j driver connection module in backend/knowledge_graph/
(connection only, no graph logic yet). Build a simple in-process job
runner in backend/workers/: on job creation, run pipeline stages
sequentially (async, via BackgroundTasks or an asyncio task), updating
AnalysisJobs.status after each stage (Uploaded→Processing→Parsed→
Reasoning→Completed). No RabbitMQ, no Redis — this is intentional for
MVP speed; keep the runner interface simple enough to swap for a real
queue later without rewriting stage logic.
```

---

## PHASE 3 — Core Development

### 3.1 Auth Service + Screens
```
Phase 3. Flow: Login/Register → Credential Validation → JWT → Dashboard
→ Role-based permissions.
Backend (backend/auth/): POST /auth/login, POST /auth/register, JWT +
encrypted sessions, RBAC middleware (Admin/Org Owner/Developer/Viewer)
reused by ALL future protected endpoints, in-process rate limit on
login, AuditLogs entry on login/register/permission-denied. OAuth
(Google/GitHub) is nice-to-have — implement only if time allows after
email/password auth works end-to-end.
Frontend: Landing, Login, Register screens (0.3 rules). Landing
sections: Product Overview, Features, Pricing, Documentation, Login.
Accept: register/login works, JWT issued, role-based nav renders per
role.
```

### 3.2 Repository Upload
```
Phase 3. Flow: Upload → Virus Scan → Extraction → Language Detection →
Structure Detection → Dependency Analysis → (next stage triggered
in-process, see 2.3).
Backend (backend/repositories/): POST /repositories/upload (ZIP or Git
URL, body {"repository_url":"...","analysis_type":"full"}), GET
/repositories, GET /repositories/{id}. Pipeline: ZIP→Extraction→Temp
Workspace→local storage (adapter from 0.2)→Auto Cleanup. Trigger job
runner (2.3) on accept — no external queue. Validate size/language/
metadata. Errors: Invalid Repo(400)->retry; Too Large(413)->show limits;
rate-limited(429). Edge cases: Empty Repo, Unsupported Language,
Corrupted ZIP, Missing Deps, Large Monorepo, Circular Deps, Partial
Parsing Failure (degrade gracefully, don't hard-fail).
State machine: Repository Uploaded->Processing->Parsed->Reasoning->
Completed.
Frontend: Dashboard shell (empty states), Repository Upload screen
(drag-drop + Git URL tab, progress indicator), Upload Progress screen.
Sidebar nav: Upload, Previous Analyses, Capability/Journey/Logic Gap
Explorer, Reports, Settings (placeholders ok).
Accept: upload works both ways, edge-case errors shown clearly, job
reaches "Uploaded".
```

### 3.3 Parser Engine
```
Phase 3. Triggered by job runner after upload stage. Pipeline: AST
Parsing -> Metadata Extraction, for React/Next.js/Node/Express/
relational-DB repos only. Extract: file tree, languages, framework
signals, dependency graph, API route inventory. Must fit <5min NFR ->
incremental parsing, parallel file processing where practical. On
success: Processing->Parsed, job runner advances to Knowledge Graph
stage. On partial failure: persist what parsed, flag partial, don't fail
whole job.
Frontend: extend Upload Progress with a "Parsing…" stage.
Accept: one sample of each MVP project type parses and reaches "Parsed".
```

### 3.3b Design System Retrofit (run once, before continuing to 3.4)
```
Phase 3, one-time retrofit. You already implemented through 3.3 (Auth +
Landing/Login/Register in 3.1; Dashboard shell + Repository Upload +
Upload Progress in 3.2; Parser wiring in 3.3) under the OLD fixed-token
design spec (hex colors #2563EB/#14B8A6/etc., Space Grotesk/Manrope/DM
Sans fonts). The design system has since changed to 0.3 (v2) — open
color/font choice, light-theme-only, content-first, no generic-AI look,
resource-library-informed motion/visuals.

Do this now, before building any further screens:
1. Pick and lock the actual design tokens (colors, font pairing,
   spacing/radius scale, background treatment) per the rules in 0.3 (v2)
   — do this once, store as CSS variables/design tokens, and treat it as
   final for the rest of the build (don't re-derive per screen).
2. Re-skin the already-built screens (Landing, Login, Register, Dashboard
   shell, Repository Upload, Upload Progress) to the new tokens: replace
   hardcoded old hex values and old font-family references with the new
   variables; apply the new background treatment (soft gradient/subtle
   texture instead of flat white) and motion rules (page transitions,
   hover states, section reveals) from 0.3 (v2).
3. Do NOT change layout structure, component logic, API calls, state
   machines, or any backend behavior from 3.1–3.3 — this is a visual/
   styling pass only.
4. Re-verify the mandatory per-screen states (empty/loading/success/
   error/validation) still render correctly after the re-skin — a
   styling pass must not silently break a state.
Accept: all six already-built screens use only the new locked tokens (no
leftover old hex/fonts anywhere in the codebase), still pass their
original 3.1–3.3 acceptance criteria, and visually match the 0.3 (v2)
bar (premium, light, not generic-AI-looking).
```

### 3.4 Knowledge Graph Generation
```
Phase 3. Triggered by job runner after parsing stage. Build Neo4j graph
from parser output (imports/calls/renders/persists-to/exposes-endpoint
relationships). Persist KnowledgeGraphs row (job_id FK) pointing to the
Neo4j subgraph. On success: Parsed->Reasoning, job runner advances to
Domain Inference (3.5).
Frontend: "Knowledge Graph Preview" widget on Dashboard — interactive,
zoomable, expandable nodes.
Accept: successful parse produces a real Neo4j graph rendered as
interactive preview.
```

### 3.5 Domain Inference (NEW — between Knowledge Graph and reasoning)
```
Phase 3. Triggered by job runner after Knowledge Graph stage, BEFORE
Capability/Journey/Gap detection. Build backend/reasoning_engine/
domain_inference.py.

Purpose: infer the business domain(s) the software serves (e.g.
e-commerce, booking/reservations, SaaS billing, content platform,
internal tooling) by analyzing the knowledge graph's entities, routes,
and DB models. This context is passed into 4.1–4.3 so their pattern
matching can be domain-aware (e.g. domain=booking → specifically check
for cancellation flows; domain=e-commerce → specifically check for
refund flows).

Output: use the Finding/Evidence shape from 0.4. Persist to
DomainInferences (domain_id, job_id FK, one or more domain labels each
with its own confidence_score, reasoning_summary, evidence list).

Apply the never-guess rule from 0.4 strictly: if signals are mixed or
too sparse to classify, persist status="Insufficient-Evidence" with
label "Unclassified" — do not force a best-guess label.

Accept: sample e-commerce repo infers "e-commerce" with grounded
evidence (product/cart/order models, checkout routes); an ambiguous
internal-tooling repo correctly comes back "Unclassified" rather than a
forced guess.
```

### 3.6 Reasoning Engine Scaffold
```
Phase 3. Wire the full pipeline end-to-end: Knowledge Graph -> Domain
Inference (3.5, real) -> Capability Detection(stub) -> Journey
Reconstruction(stub) -> Logic Gap Detection(stub). Every stub, even
placeholder, MUST already emit the Finding/Evidence shape from 0.4 (not
freeform text) so 4.1–4.3 slot in without a schema change. Wire the LLM
provider for domain inference + later NL explanations; every LLM call
must use the never-guess instruction from 0.4. On pipeline completion:
Reasoning->Completed.
```

### 3.7 Full Interactive Dashboard
```
Phase 3. Backend: GET /analysis/{id}, GET /dashboard/{id}. Frontend:
complete Dashboard Layout — Top Nav, Left Sidebar, Repository Summary,
Analysis Cards, Knowledge Graph Preview(live), Domain Summary widget
(inferred domain(s) + confidence, from 3.5), Capability Cards
(placeholder), Journey Visualization(placeholder), Logic Gap Alerts
(placeholder), Recent Activity. Build Repository History screen (status
badges).
Accept: completed analysis renders full dashboard incl. real domain
inference; capability/journey/gap sections marked placeholder for Phase
4.
```

---
agy --conversation=b17c0b81-ef55-4e15-b430-d16be8674453
## PHASE 4 — AI Reasoning Engine

### 4.1 Capability Intelligence
```
Phase 4. Replace Capability Detection stub. Detect: Authentication,
Payments, Inventory, Notifications, Analytics (extensible). Use the
Domain Inference output (3.5) as context to bias pattern matching. Use
the exact Finding/Evidence shape and never-guess rule from 0.4 — no
capability without cited evidence. Backend: GET /capabilities/{id},
persist to Capabilities. Frontend: Capability Explorer screen — badge,
confidence, explanation, expandable evidence list; full state set (0.3).
Accept: sample app w/ login+payments+inventory correctly detected with
plausible confidence + correct evidence; no capability appears without
evidence.
```

### 4.2 Journey Reconstruction
```
Phase 4. Replace Journey Reconstruction stub. Sub-flow: Identify User
Actions -> Connect APIs -> Connect Database -> Build End-to-End Flow.
Use Domain Inference context. Use 0.4's Finding/Evidence shape +
never-guess rule. Backend: GET /journeys/{id}, persist to UserJourneys —
ordered step list (Action->API->DB->Outcome) with evidence, confidence,
NL narrative. Frontend: Journey Explorer — step-flow visualization,
expandable nodes; full state set (0.3).
Accept: e.g. "Add to Cart -> POST /cart/add -> Cart/Inventory tables ->
updated" reconstructed with real evidence.
```

### 4.3 Logic Gap Detection
```
Phase 4. Replace Logic Gap Detection stub. Categories: Missing Refund
Flow, Missing Password Recovery, Missing Booking Cancellation, Missing
Error Recovery (extensible). Use Domain Inference to decide which gap
checks are even relevant (don't check for "Missing Refund Flow" on a
repo with no Payments capability and no e-commerce/booking domain
signal). Use 0.4's Finding/Evidence shape + never-guess rule strictly —
this is the highest hallucination-risk area; every gap must cite the
related capability/journey (or its absence) as evidence, and must go
through the API-layer validation guard from 0.4. Backend: GET
/logic-gaps/{id}, persist to LogicGaps. Frontend: Logic Gap Explorer —
alert cards colored via Warning/Error tokens; full state set (0.3).
Accept: app w/ Payments but no refund endpoint -> "Missing Refund Flow"
correctly flagged; app with a proper refund flow, or with no payments
domain at all -> no false positive.
```

### 4.4 Evidence Panel UI
```
Phase 4. Build ONE shared "Evidence Panel" component, reused by
Capability/Journey/Logic Gap Explorers and the Domain Summary widget:
shows reasoning_summary + confidence_score (with High/Medium/Low
styling) + clickable evidence list from 0.4's schema. Add a UI-level
guardrail: any finding with status="Insufficient-Evidence" renders
distinctly (muted, "Low signal") and never looks equivalent to a
Confirmed finding. Confirm this panel is the ONLY place explanations are
rendered app-wide (no ad hoc explanation text elsewhere) so evidence
display is consistent.
```

### 4.5 Benchmark & Evaluation (gates "MVP complete")
```
Phase 4, final gate before Phase 5. Build tests/benchmark/ with 3–5
reference repositories chosen to stress-test the pipeline:
1. An e-commerce app (has Payments + a real refund flow) — expect no
   "Missing Refund Flow" gap.
2. A booking/reservations app missing a cancellation endpoint — expect
   "Missing Booking Cancellation" to be correctly flagged.
3. A simple auth-only SaaS app with no payments/booking — expect
   Domain Inference = SaaS/tooling and NO payments/booking-related gaps
   fabricated.
4. An app with a genuinely ambiguous/thin structure — expect
   Domain Inference = "Unclassified" rather than a forced guess.
(Add a 5th of your choice if time allows, e.g. one with password
recovery intentionally missing.)

For each reference repo, hand-author an expected-findings JSON (which
domain, capabilities, journeys, and gaps SHOULD and SHOULD NOT appear)
and store alongside the repo fixture in tests/benchmark/fixtures/.

Build a small eval harness (scripts/benchmark/run_eval.py) that runs the
full pipeline (Upload→...→Logic Gap Detection) on each fixture and diffs
actual vs expected findings, reporting: true positives, false positives
(= hallucinations — any finding not backed by real evidence in that
repo), false negatives (missed findings), and confidence calibration
(are High-confidence findings actually the correct ones?).

Pass bar to declare MVP complete: (a) ZERO fabricated findings across
all fixtures — this must be zero, not "low," because 0.4's guard should
already make this structurally impossible; if any appear, treat it as a
bug in the guard, not an acceptable miss; (b) the engine correctly
detects the majority of seeded capabilities/gaps per fixture; (c)
Domain Inference is correct or "Unclassified" on every fixture — never
wrong-but-confident.

Do not proceed to Phase 5 sign-off until this benchmark passes. Save the
eval report to docs/benchmark-report.md.
```

---

## PHASE 5 — Testing, Reports & Remaining Screens

### 5.1 Reports & Export (FR-10)
```
Phase 5. Backend: POST /reports/export, GET /reports/{id}, persist to
Reports table. Generate synchronously or via the in-process job runner
(2.3) — no external queue needed at MVP scale. Report content: repo
stats + domain + capabilities + journeys + gaps summary, each with its
confidence/evidence from 0.4. Frontend: Reports screen — list, export
action, download; full state set (0.3).
```

### 5.2 Full Test Suite
```
Phase 5. Implement: Unit tests (services, reasoning modules incl. domain
inference, components), Integration tests (upload->parse->KG->domain
inference->reasoning->dashboard), API tests on all endpoints (verify
400/401/403/404/413/429/500), Performance tests (<5min medium repo),
Security tests (HTTPS, AES-256, JWT expiry, injection resistance,
parameterized queries, rate limits, no secrets in logs, audit logs
written), E2E test (full journey login->export), UAT scripts for
Developer Flow and Admin Flow (5.4), and confirm the 4.5 Benchmark
report is attached as a gating test result. Save results to docs/.
```

### 5.3 Error Handling & Basic Observability
```
Phase 5. Keep this MVP-light: structured JSON logging, a /health
endpoint, consistent HTTP error response shape, retry-with-backoff on
LLM provider calls specifically (they're the most failure-prone
external dependency), graceful degradation (e.g. dashboard still loads
if the KG preview render is briefly slow). Full tracing/metrics stack
(OpenTelemetry/Prometheus/Grafana/ELK) is deferred — see Appendix A.2.
```

### 5.4 Admin, Org Management, Settings, Profile
```
Phase 5. Admin Flow: Admin Login -> User Management -> Repository
Monitoring -> System Analytics -> Audit Logs -> Configuration.
Build: Admin Dashboard (user mgmt+role assign, cross-org repo/job
monitoring, KPI analytics, AuditLogs viewer, config — Admin-only),
Organization Management (Org Owner: members/roles/org repos), Settings +
Profile (account edit, notification prefs, org switcher). Enforce RBAC
strictly; add negative-path test (non-admin blocked from Admin
Dashboard).
```

---

## PHASE 6 — Deployment & Launch (lightweight, no K8s)

### 6.1 Simple Deployment
```
Phase 6. Deploy as two containers (frontend, backend) plus managed/
hosted PostgreSQL and Neo4j (e.g. a single Neo4j instance/Aura free tier)
via docker-compose on a single host, or a simple PaaS (Render/Railway/
Fly.io-style). No Kubernetes, no API gateway, no load balancer for MVP.
HTTPS via the platform's TLS or a lightweight reverse proxy (Caddy/
Nginx).
```

### 6.2 Secrets & Basic Monitoring
```
Phase 6. Move all credentials (Postgres, Neo4j, LLM provider, SMTP if
used, JWT signing key) into env vars / the platform's secret store — no
plaintext in repo. Confirm audit logging (3.1) and rate limiting (0.2)
are live. Basic uptime/error alerting only (structured logs + a simple
alert on repeated 500s or job failures) — full observability stack is
post-MVP (Appendix A.2).
```

### 6.3 Documentation & Rollout
```
Phase 6. Produce: API Docs (FastAPI's OpenAPI, auto-generated), finalized
Architecture Doc, Developer Guide (docker-compose setup), Deployment
Guide (6.1–6.2), User Manual (walkthrough of all 16 screens), v1.0
Release Notes — include the 4.5 Benchmark results as evidence the
reasoning engine was validated before release. Deploy to staging, run
5.2's E2E+UAT suites, promote to production.
Accept (Success Criteria): repo analyzed in prod, domain inferred,
capabilities/journeys/gaps detected with evidence, dashboard generated,
<5min perf held, benchmark passed, deployed successfully.
```

---

## Appendix — Post-MVP

### A.1 v1.5
```
Post-MVP. Add: more supported languages/frameworks, richer Knowledge
Graph Preview + Journey Visualization, expand Domain Inference to more
domain categories using the 4.5 benchmark process to validate each
addition before shipping it.
```

### A.2 Infra Scale-Up (introduce only when real load demands it)
```
Post-MVP, only when usage/scale justifies it — not before. Introduce:
Kubernetes (multi-instance orchestration/autoscaling), RabbitMQ (replace
the in-process job runner with real distributed queues), Redis (session
+ dashboard + report caching), MinIO/S3 (replace local filesystem
storage adapter — the 0.2 adapter interface was designed for this swap),
API Gateway (centralize auth/rate-limiting if/when services actually
split), full observability stack (OpenTelemetry, Prometheus, Grafana,
ELK). Treat this as a dedicated infra-migration project, not an
extension of hackathon scope.
```

### A.3 v2.0
```
Post-MVP. IDE plugins, enterprise SSO+governance, continuous/live repo
monitoring, GraphQL API, gRPC services, event-driven architecture,
vector DB integration, multi-region deployment, webhook integrations, AI
Copilot, multi-language repos, team collaboration, plugin ecosystem,
marketplace integrations, interactive architecture map, 3D repo
visualization, AI assistant sidebar, collaborative commenting, real-time
multi-user sessions, custom dashboard widgets, MFA.
```
