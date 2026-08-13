-- ============================================================================
-- CodeAtlas: Initial PostgreSQL Schema
-- Target: Supabase PostgreSQL
-- Generated from existing SQLite schema (SQLAlchemy models)
--
-- This migration creates the exact tables the application requires.
-- No tables have been added or removed relative to the SQLite schema.
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled on Supabase.
-- Supabase enables this by default, but this is a safety net.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: users
-- Purpose: User accounts for authentication (email/password + Google OAuth).
-- Accessed by: auth/routes.py (register, login, google callback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT        PRIMARY KEY,
    email       TEXT        NOT NULL UNIQUE,
    name        TEXT,
    password    TEXT        NOT NULL,
    role        TEXT        NOT NULL DEFAULT 'Developer',
    auth_provider TEXT      NOT NULL DEFAULT 'email',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: email lookups on every login and registration check.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ============================================================================
-- TABLE: repositories
-- Purpose: Stores metadata for uploaded or cloned code repositories.
-- Accessed by: repositories/routes.py (upload, list, get by ID)
-- ============================================================================
CREATE TABLE IF NOT EXISTS repositories (
    repo_id     TEXT        PRIMARY KEY,
    name        TEXT,
    url         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: analysis_jobs
-- Purpose: Tracks each analysis run. Stores the full results payload (findings
--          and graph preview) as JSONB once analysis completes.
-- Accessed by: repositories/routes.py, reasoning_engine/routes.py,
--              workers/job_runner.py
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id       TEXT        PRIMARY KEY,
    repo_id      TEXT        REFERENCES repositories(repo_id),
    project_name TEXT,
    status       TEXT,
    error        TEXT,
    findings     JSONB       NOT NULL DEFAULT '{}'::jsonb,
    graph_preview JSONB      NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: foreign key lookups (list jobs by repository).
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_repo_id ON analysis_jobs (repo_id);

-- Index: status filtering (frontend polls for Completed/Failed jobs).
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs (status);

-- ============================================================================
-- TABLE: audit_logs
-- Purpose: Append-only log of security-relevant events (logins, failed
--          attempts, permission denials, registrations).
-- Accessed by: auth/dependencies.py (log_audit_event)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL      PRIMARY KEY,
    user_id     TEXT,
    action      TEXT,
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: lookup audit events by user.
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- Index: time-range queries on audit logs (admin reporting, retention).
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
