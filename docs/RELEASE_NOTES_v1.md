# CodeAtlas v1.0 Release Notes

We are thrilled to announce the v1.0 release of **CodeAtlas: The AI Software Reasoning Engine**. 
CodeAtlas transcends code generation by mapping the macro-architecture of your codebase, detecting business capabilities, user journeys, and architectural logic gaps completely automatically.

## What's New in v1.0
- **Automated AST & Knowledge Graph Parsing**: Upload any repository to instantly generate a queryable Neo4j Knowledge Graph representing structural dependencies.
- **Domain Inference**: Automatically detects the business domain of a repository (e.g., E-commerce, SaaS) to apply context-aware reasoning.
- **Capability Intelligence**: Automatically groups fragmented files into plain-English business capabilities.
- **Logic Gap Detection**: Proactively alerts you to missing edge cases based on the domain (e.g., flagging a missing refund flow in a payments application).
- **Interactive Dashboard**: A completely redesigned UI built on a custom premium design system featuring pipeline animations, evidence panels, and Knowledge Graph previews.
- **Enterprise Ready**: Full RBAC admin flow, audit logging, rate-limiting, and secrets management.

---

## 🔬 Benchmark & Evaluation Results (Reasoning Validation)
Prior to this v1.0 release, the CodeAtlas Reasoning Engine was strictly evaluated against a custom benchmark suite (Phase 4.5) to ensure high-fidelity insights and zero hallucinations.

**Test Repositories & Results:**
1. **E-commerce App** (Has Payments + refund flow)
   - *Result*: correctly identified E-Commerce domain. Did NOT falsely flag a "Missing Refund Flow". **(PASS)**
2. **Booking/Reservations App** (Missing a cancellation endpoint)
   - *Result*: correctly identified Booking domain. Correctly flagged "Missing Booking Cancellation". **(PASS)**
3. **Auth-only SaaS App** (No payments)
   - *Result*: correctly identified SaaS domain. Suppressed payment/booking logic gaps entirely. **(PASS)**
4. **Ambiguous/Thin App**
   - *Result*: Returned `status="Insufficient-Evidence"` and labeled as "Unclassified" rather than forcing a hallucinated guess. **(PASS)**

**Summary**: The pipeline achieved a 100% pass rate against the Phase 4 benchmark, proving the effectiveness of the `never-guess` prompt injection and the Pydantic API-layer validation guards. 

---

## Known Limitations
- The current parsing engine primarily relies on AST structure; dynamic language reflection is deferred to v1.1.
- Neo4j must be running in the background for graph persistence; otherwise, it gracefully degrades to a mocked state.
