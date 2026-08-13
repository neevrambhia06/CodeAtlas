-- ============================================================================
-- CodeAtlas: Supabase Database Migration
-- Target: Supabase PostgreSQL
-- Purpose: Add lifecycle timestamps to analysis_jobs for better tracking
-- ============================================================================

ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_analysis_jobs_modtime ON analysis_jobs;

CREATE TRIGGER update_analysis_jobs_modtime
BEFORE UPDATE ON analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
