-- Migration: 20260911000000_import_sessions.sql
-- Description: Add import_sessions and import_session_items for Phase 11 Intelligent Archive Capture & Import Pipeline

-- 1. Import Sessions Table
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT NOT NULL DEFAULT 'studio-admin',
    name TEXT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    day_id UUID REFERENCES days(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'CREATED', -- 'CREATED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    total_files INTEGER NOT NULL DEFAULT 0,
    processed_files INTEGER NOT NULL DEFAULT 0,
    successful_files INTEGER NOT NULL DEFAULT 0,
    duplicate_files INTEGER NOT NULL DEFAULT 0,
    failed_files INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);

-- 2. Import Session Items Table (tracks file-level outcomes, duplicates, and failures)
CREATE TABLE IF NOT EXISTS import_session_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    content_hash TEXT,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'DUPLICATE' | 'FAILED'
    error_message TEXT,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Link media directly to an import session
ALTER TABLE media
    ADD COLUMN IF NOT EXISTS import_session_id UUID REFERENCES import_sessions(id) ON DELETE SET NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_session_items ENABLE ROW LEVEL SECURITY;

-- 5. Studio-only access policies (Authenticated & Service Role only; anonymous access prohibited)
CREATE POLICY studio_all_import_sessions ON import_sessions
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY studio_all_import_session_items ON import_session_items
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 6. Indexes for efficient lookup & ordering
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON import_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_sessions_trip_id ON import_sessions(trip_id);
CREATE INDEX IF NOT EXISTS idx_import_session_items_session_id ON import_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_import_session_items_status ON import_session_items(status);
CREATE INDEX IF NOT EXISTS idx_media_import_session_id ON media(import_session_id);
