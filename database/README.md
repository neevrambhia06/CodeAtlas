# CodeAtlas Database

This directory contains the database migration scripts and schema documentation for PostgreSQL.

## ER Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has"
    ORGANIZATIONS ||--o{ REPOSITORIES : "owns"
    REPOSITORIES ||--o{ REPOSITORY_FILES : "contains"
    REPOSITORIES ||--o{ ANALYSIS_JOBS : "spawns"
    ANALYSIS_JOBS ||--o{ CAPABILITIES : "produces"
    ANALYSIS_JOBS ||--o{ USER_JOURNEYS : "produces"
    ANALYSIS_JOBS ||--o{ LOGIC_GAPS : "produces"
    ANALYSIS_JOBS ||--o{ DOMAIN_INFERENCES : "produces"
    ANALYSIS_JOBS ||--o{ KNOWLEDGE_GRAPHS : "produces"
    ANALYSIS_JOBS ||--o{ REPORTS : "produces"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    ORGANIZATIONS {
        uuid org_id PK
        string name
    }
    USERS {
        uuid user_id PK
        uuid org_id FK
        string email
        string role
    }
    REPOSITORIES {
        uuid repo_id PK
        uuid organization_id FK
        string name
        string url
        bigint size_bytes
        string language
    }
    REPOSITORY_FILES {
        uuid file_id PK
        uuid repo_id FK
        text file_path
    }
    ANALYSIS_JOBS {
        uuid job_id PK
        uuid repo_id FK
        string status
        jsonb job_metadata
    }
    CAPABILITIES {
        uuid capability_id PK
        uuid job_id FK
        float confidence_score
        jsonb evidence
        string status
    }
    USER_JOURNEYS {
        uuid journey_id PK
        uuid job_id FK
        float confidence_score
        jsonb evidence
        string status
    }
    LOGIC_GAPS {
        uuid gap_id PK
        uuid job_id FK
        float confidence_score
        jsonb evidence
        string status
    }
    DOMAIN_INFERENCES {
        uuid domain_id PK
        uuid job_id FK
        float confidence_score
        jsonb evidence
        string status
    }
    KNOWLEDGE_GRAPHS {
        uuid kg_id PK
        uuid job_id FK
        jsonb graph_data
    }
    REPORTS {
        uuid report_id PK
        uuid job_id FK
        text report_url
    }
    NOTIFICATIONS {
        uuid notification_id PK
        uuid user_id FK
        text message
    }
    AUDIT_LOGS {
        uuid log_id PK
        uuid user_id FK
        string action
    }
```

## API-Layer Validation Constraints

In accordance with Phase 2.2 requirements, the following validators are enforced at the API/Application layer:
- **Email Uniqueness**: Supported by a database `UNIQUE` constraint, explicitly caught and handled by the API layer upon conflict.
- **Repo Size Limit**: API rejects uploads exceeding the max repository size limit before any bytes are processed.
- **Supported-Language Check**: API verifies the repository contains supported languages (Node.js/React/Next.js).
- **Required Job Metadata**: API strictly enforces the presence and structure of necessary configuration in `job_metadata` before initiating an AnalysisJob.
- **JWT/Role Validation**: API routing enforces RBAC mapping (Admin, Organization Owner, Developer, Viewer) on all routes.
