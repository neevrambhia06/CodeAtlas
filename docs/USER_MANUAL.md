# CodeAtlas User Manual

This manual covers the 16 primary screens and user flows within CodeAtlas.

## 1. Landing & Authentication
1. **Landing Page (`/`)**: Discover CodeAtlas's capability as a business logic reasoning engine. View the pipeline animation and core features.
2. **Register (`/register`)**: Create a new account or join an existing organization.
3. **Login (`/login`)**: Authenticate to access your organization's dashboard.

## 2. Core Dashboard
4. **Dashboard Home (`/dashboard`)**: The central hub. Displays the Domain Inference widget, Knowledge Graph Preview, and links to specialized reasoning modules.
5. **Upload Repository (`/dashboard/upload`)**: Drop a `.zip` or link a Git URL. Triggers the AST parsing and LLM reasoning pipeline.
6. **Analysis History (`/dashboard/history`)**: Track the status (Pending/Running/Completed/Failed) of all past reasoning jobs.

## 3. Reasoning Explorers
7. **Capability Explorer (`/dashboard/capabilities`)**: View high-level business features (e.g., Payments, Auth) mapped to specific file evidence.
8. **Journey Explorer (`/dashboard/journeys`)**: Step-by-step visualizations tracing a user action (e.g., clicking "Checkout") down to the specific database table modified.
9. **Logic Gap Alerts (`/dashboard/gaps`)**: Security and architecture warnings. Highlights missing flows (e.g., a missing Refund flow in an E-Commerce domain).
10. **Evidence Panel (Shared Component)**: Clicking any capability, journey, or gap opens a detailed panel citing the exact AST lines and the LLM confidence score.

## 4. Organization & Settings
11. **Settings - Profile (`/settings`)**: Update your personal details and email.
12. **Settings - Organization (`/settings?tab=organization`)**: Manage Acme Corp, view connected repositories, and invite members.
13. **Settings - Notifications (`/settings?tab=notifications`)**: Configure email alerts for completed jobs and high-severity logic gaps.

## 5. Admin Flow (RBAC Protected)
14. **Admin - KPI Analytics (`/admin`)**: View system-wide job processing times, total parses, and active users.
15. **Admin - User Management (`/admin?tab=users`)**: Assign/revoke roles (Admin, Owner, Developer) across all organizations.
16. **Admin - Audit Logs (`/admin?tab=audit`)**: Immutable log viewer tracking authentication events and pipeline triggers.
