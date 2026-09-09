-- Migration: 20260909010000_media_experience.sql
-- Description: Add alt_text and position columns to media table for Phase 2 Media Experience

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS alt_text TEXT,
    ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Index for ordering media within trips, days, and places
CREATE INDEX IF NOT EXISTS idx_media_position ON media(trip_id, position);
CREATE INDEX IF NOT EXISTS idx_media_day_position ON media(day_id, position);
CREATE INDEX IF NOT EXISTS idx_media_place_position ON media(place_id, position);
