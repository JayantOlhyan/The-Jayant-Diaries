-- Phase 14: Story Editorial Migration
ALTER TABLE stories ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_stories_trip_id ON stories(trip_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
