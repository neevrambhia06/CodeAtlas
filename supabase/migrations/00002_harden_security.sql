-- ============================================================================
-- CodeAtlas: Supabase Database Security Hardening
-- Target: Supabase PostgreSQL
-- Purpose: Secures the database for a Backend-Only Architecture
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on all tables.
-- By default, enabling RLS without adding any policies denies ALL access
-- through the Supabase Data API (PostgREST) for `anon` and `authenticated` roles.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies that might exist from testing
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON repositories;
DROP POLICY IF EXISTS "Allow public read access" ON analysis_jobs;
DROP POLICY IF EXISTS "Allow public read access" ON audit_logs;

-- Note: The FastAPI backend connects using the `postgres` superuser (via DATABASE_URL).
-- The `postgres` role inherently bypasses RLS (BYPASSRLS).
-- Therefore, backend operations (INSERT, UPDATE, DELETE, SELECT) will continue
-- to function normally, while direct frontend/API access is completely blocked.
