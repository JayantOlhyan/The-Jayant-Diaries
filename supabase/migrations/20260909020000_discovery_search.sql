-- Migration: 20260909020000_discovery_search.sql
-- Description: Add text search indexes for Phase 4 Discovery & Archive Navigation

-- Index for searching trips by title
CREATE INDEX IF NOT EXISTS idx_trips_title_search ON trips USING btree (title);

-- Index for searching places by name
CREATE INDEX IF NOT EXISTS idx_places_name_search ON places USING btree (name);

-- Index for searching memories by title
CREATE INDEX IF NOT EXISTS idx_memories_title_search ON memories USING btree (title);

-- Index for searching media by caption
CREATE INDEX IF NOT EXISTS idx_media_caption_search ON media USING btree (caption);
