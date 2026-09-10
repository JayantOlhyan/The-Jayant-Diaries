-- Migration: 20260910010000_archive_curation.sql
-- Description: Add curation_status and supporting indexes for Phase 8 Archive Intelligence & Curation

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS curation_status TEXT NOT NULL DEFAULT 'IMPORTED';

-- Indexes for efficient Studio curation queries and health aggregation
CREATE INDEX IF NOT EXISTS idx_media_curation_status ON media(curation_status);
CREATE INDEX IF NOT EXISTS idx_media_content_hash ON media(content_hash);
CREATE INDEX IF NOT EXISTS idx_media_taken_at ON media(taken_at);
CREATE INDEX IF NOT EXISTS idx_media_trip_day_place ON media(trip_id, day_id, place_id);
