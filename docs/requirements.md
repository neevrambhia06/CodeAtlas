# CodeAtlas: Requirements Document

## Product Overview
**CodeAtlas** is an AI Software Reasoning Engine. Unlike traditional code assistants (Copilot, Cursor) or code search tools (Sourcegraph, CodeSee) that operate primarily on syntax and text, CodeAtlas operates at the business and architectural level. It reconstructs system architecture, business capabilities, user journeys, and logic gaps directly from source repositories. 

**Problem**: Developers and engineering leaders struggle to understand complex, undocumented, or inherited codebases. Determining business logic, user journeys, and systemic logic gaps takes weeks of manual tracing. 

**Vision**: Provide an evidence-grounded, highly explainable reasoning engine that automatically translates source code into high-level capabilities, allowing teams to instantly comprehend the business impact and architectural structure of their software.

## Goals
- Deliver a working MVP during the hackathon focusing on a correct, evidence-grounded analysis pipeline.
- Prove the concept that LLMs and Knowledge Graphs can reliably infer business logic without manual documentation.
- Establish a scalable monolith architecture capable of supporting an eventual transition to microservices if required.
- Maintain a strict "Never-Guess" policy: all AI inferences must be grounded in explicit, traceable evidence.

## Personas
1. **New Developer**
   - **Goals**: Quickly understand the codebase structure, where to make changes, and the flow of specific user journeys.
   - **Pain Points**: Lack of documentation, overwhelming codebase size, hidden side-effects.
2. **Senior Architect**
   - **Goals**: Ensure architectural consistency, identify logic gaps or anti-patterns, and visualize system capabilities.
   - **Pain Points**: Drift between design and implementation, complex dependency graphs, manual code reviews.
3. **Engineering Manager**
   - **Goals**: Monitor tech debt, understand capability coverage, and onboard developers faster.
   - **Pain Points**: Unclear mapping between business requirements and deployed code, slow onboarding.
4. **CTO / Product Owner**
   - **Goals**: Gain high-level visibility into system capabilities, audit business logic rules, and ensure the product is built securely.
   - **Pain Points**: Technical jargon barrier, lack of high-level system observability.

## Functional & Non-Functional Requirements

### Functional Requirements (FRs)
- **FR-01 Repo Upload**: Ability to upload a local repository.
- **FR-02 Git Import**: Ability to ingest code via Git repository links.
- **FR-03 Parsing**: Extract AST and metadata from supported languages.
- **FR-04 Knowledge Graph**: Build a structural graph in Neo4j representing the codebase.
- **FR-05 Capability Detection**: Infer and map high-level business capabilities.
- **FR-06 Journey Reconstruction**: Trace and reconstruct end-to-end user journeys.
- **FR-07 Logic Gap Detection**: Identify missing validations, unhandled edge cases, and architectural flaws.
- **FR-08 Dashboard**: An interactive, Next.js-based dashboard to visualize findings.
- **FR-09 Explainable AI**: Every AI claim must be traceable to specific code evidence.
- **FR-10 Export Reports**: Ability to export the analysis reports.

### Non-Functional Requirements (NFRs)
- **Performance**: Full analysis must complete in < 5 minutes for a medium-sized repository.
- **Explainability**: Strict enforcement of the NEVER-GUESS rule; no assertion without evidence.
- **Security**: HTTPS everywhere, AES-256 at rest, JWT auth, parameterized queries, in-process rate limiting (e.g. slowapi), audit logs, no hardcoded secrets.
- **Accessibility**: UI must meet WCAG 2.1 AA standards.

## MoSCoW Prioritization
| Category | Features |
| -------- | -------- |
| **Must Have** | Repo Upload, Parsing, Knowledge Graph (KG), Domain Reasoning (Capabilities/Journeys/Gaps), Dashboard. |
| **Should Have** | Team Collaboration features, Report Export. |
| **Could Have** | Multi-language support (beyond MVP scope). |
| **Won't Have (MVP)**| IDE plugins, Live real-time code editing. |

## RBAC Roles
- **Admin**: Full system access, capable of managing users, roles, and global settings.
- **Organization Owner**: Can manage users, billing, and global repo settings within their organization.
- **Developer**: Can upload repos, trigger analyses, and view all insights and reasoning graphs.
- **Viewer**: Read-only access to dashboards, reconstructed journeys, and logic gaps.

## KPIs
- **Completion Rate**: Percentage of successfully parsed and analyzed repositories without critical failures.
- **Time-to-Insight**: Average time from repo upload to dashboard availability (< 5 minutes target).
- **Adoption**: Number of active users/organizations utilizing the platform.
- **Reasoning Accuracy**: Percentage of AI-generated capabilities and gaps confirmed as accurate by developers (measured via feedback).
- **Retention**: Frequency of users returning to analyze new commits or repos.

## Risks & Mitigations
- **Bad Inference (Hallucinations)**: Mitigated by the NEVER-GUESS strict evidence confidence model.
- **Unsupported Languages**: MVP scoped strictly to Next.js, Node.js, Express, React, Postgres.
- **Large Repositories**: Risk of OOM or timeouts; mitigated by background task processing and batching.
- **LLM Cost**: Expensive token usage; mitigated by localized AST parsing and sending only necessary contexts.
- **Privacy**: User code exposure; mitigated by AES-256 at rest, robust RBAC, and secure local file storage.

## Constraints
- **MVP Language Scope**: Strictly limited to React, Next.js, Node.js, Express, and relational DBs.
- **Simplified Infra**: No Kubernetes, RabbitMQ, API Gateways, Redis, or MinIO/S3 for MVP. Instead using FastAPI monolith, Postgres, Neo4j, FastAPI BackgroundTasks, and local filesystem.

## Competitive Differentiator
Unlike Copilot or Cursor which focus on inline code generation and line-by-line assistance, or Sourcegraph/CodeSee which focus on syntactic search and dependency visualization, **CodeAtlas operates at the business reasoning tier**. It provides architectural intelligence, translates code into business logic capabilities, and explicitly highlights gaps in the system design using an explainable, evidence-backed approach.

## Acceptance Criteria
- Users can upload a React/Node.js repository and view an interactive capability dashboard within 5 minutes.
- The system correctly generates a Neo4j Knowledge Graph of the code.
- All AI inferences explicitly cite code snippets as evidence.
- The UI adheres to the predefined design system and accessibility standards.

## Future Scope (Including Infra Scale-Up)
- **Languages**: Python, Java, Go, C#.
- **Integration**: Live IDE plugins (VS Code, IntelliJ) and GitHub/GitLab PR hooks.
- **Infrastructure (Appendix A.2 Path)**: 
  - Transition from local storage to MinIO/S3.
  - Introduce RabbitMQ for distributed job queues.
  - Deploy via Kubernetes for horizontal scaling.
  - Add Redis for caching ASTs and LLM responses.
  - Split specific monolithic modules into microservices *only* if bottlenecked.
