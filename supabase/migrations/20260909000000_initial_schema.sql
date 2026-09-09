-- ==============================================================================
-- THE JAYANT DIARIES — INITIAL RELATIONAL SCHEMA
-- Migration: 20260909000000_initial_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE visibility_type AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trip_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO', 'REEL', 'STORY', 'AUDIO', 'DOCUMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instagram_type AS ENUM ('POST', 'REEL', 'CAROUSEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 4. CORE ENTITY TABLES
-- ==============================================================================

-- 4.1 PLACES
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL DEFAULT 'India',
    state TEXT,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    cover_media_id UUID, -- Foreign key added after media table creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 TRIPS
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_media_id UUID, -- Foreign key added after media table creation
    start_date DATE,
    end_date DATE,
    status trip_status NOT NULL DEFAULT 'DRAFT',
    featured BOOLEAN NOT NULL DEFAULT false,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3 DAYS
CREATE TABLE IF NOT EXISTS days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    date DATE,
    title TEXT,
    description TEXT,
    journal TEXT,
    cover_media_id UUID, -- Foreign key added after media table creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_trip_day_number UNIQUE (trip_id, day_number)
);

-- 4.4 MEMORIES
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    journal TEXT,
    date DATE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    day_id UUID REFERENCES days(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    featured BOOLEAN NOT NULL DEFAULT false,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 MEDIA
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    type media_type NOT NULL DEFAULT 'PHOTO',
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration NUMERIC(8, 2),
    file_size_bytes BIGINT,
    content_hash TEXT,
    taken_at TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    day_id UUID REFERENCES days(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
    caption TEXT,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADD FOREIGN KEYS FOR COVER MEDIA
ALTER TABLE places 
    ADD CONSTRAINT fk_places_cover_media 
    FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL;

ALTER TABLE trips 
    ADD CONSTRAINT fk_trips_cover_media 
    FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL;

ALTER TABLE days 
    ADD CONSTRAINT fk_days_cover_media 
    FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL;

-- 4.6 INSTAGRAM CONTENT
CREATE TABLE IF NOT EXISTS instagram_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instagram_url TEXT NOT NULL UNIQUE,
    shortcode TEXT NOT NULL UNIQUE,
    type instagram_type NOT NULL DEFAULT 'POST',
    caption TEXT,
    published_at TIMESTAMPTZ,
    thumbnail_url TEXT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    day_id UUID REFERENCES days(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.7 TAGS
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.8 STORIES
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    content TEXT NOT NULL,
    cover_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    featured BOOLEAN NOT NULL DEFAULT false,
    visibility visibility_type NOT NULL DEFAULT 'PRIVATE',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. JUNCTION TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS trip_places (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (trip_id, place_id)
);

CREATE TABLE IF NOT EXISTS day_places (
    day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (day_id, place_id)
);

CREATE TABLE IF NOT EXISTS memory_tags (
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (memory_id, tag_id)
);

CREATE TABLE IF NOT EXISTS media_tags (
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (media_id, tag_id)
);

CREATE TABLE IF NOT EXISTS story_media (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (story_id, media_id)
);

CREATE TABLE IF NOT EXISTS story_places (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (story_id, place_id)
);

CREATE TABLE IF NOT EXISTS story_trips (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (story_id, trip_id)
);

CREATE TABLE IF NOT EXISTS instagram_content_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instagram_content_id UUID NOT NULL REFERENCES instagram_content(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('TRIP', 'DAY', 'PLACE', 'MEMORY', 'STORY')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. INDEXES
-- ==============================================================================

-- Slugs & unique lookups
CREATE INDEX IF NOT EXISTS idx_trips_slug ON trips(slug);
CREATE INDEX IF NOT EXISTS idx_places_slug ON places(slug);
CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Foreign keys & relationships
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);
CREATE INDEX IF NOT EXISTS idx_memories_trip_id ON memories(trip_id);
CREATE INDEX IF NOT EXISTS idx_memories_day_id ON memories(day_id);
CREATE INDEX IF NOT EXISTS idx_memories_place_id ON memories(place_id);
CREATE INDEX IF NOT EXISTS idx_media_trip_id ON media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_day_id ON media(day_id);
CREATE INDEX IF NOT EXISTS idx_media_place_id ON media(place_id);
CREATE INDEX IF NOT EXISTS idx_media_memory_id ON media(memory_id);
CREATE INDEX IF NOT EXISTS idx_media_content_hash ON media(content_hash);
CREATE INDEX IF NOT EXISTS idx_instagram_trip_id ON instagram_content(trip_id);

-- Filter & Ordering performance
CREATE INDEX IF NOT EXISTS idx_trips_visibility_status ON trips(visibility, status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_taken_at ON media(taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_visibility ON media(visibility);

-- ==============================================================================
-- 7. ATTACH UPDATED_AT TRIGGERS
-- ==============================================================================

CREATE TRIGGER set_timestamp_places BEFORE UPDATE ON places FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_trips BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_days BEFORE UPDATE ON days FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_memories BEFORE UPDATE ON memories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_media BEFORE UPDATE ON media FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_instagram BEFORE UPDATE ON instagram_content FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp_stories BEFORE UPDATE ON stories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_content_links ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (Anonymous / Public Visitors)
CREATE POLICY "Public trips are viewable by everyone" ON trips
    FOR SELECT USING (visibility = 'PUBLIC' AND status = 'PUBLISHED');

CREATE POLICY "Public days are viewable if trip is public" ON days
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = days.trip_id 
              AND trips.visibility = 'PUBLIC' 
              AND trips.status = 'PUBLISHED'
        )
    );

CREATE POLICY "Public places are viewable by everyone" ON places
    FOR SELECT USING (true);

CREATE POLICY "Public memories are viewable by everyone" ON memories
    FOR SELECT USING (visibility = 'PUBLIC');

CREATE POLICY "Public media is viewable by everyone" ON media
    FOR SELECT USING (visibility = 'PUBLIC');

CREATE POLICY "Public stories are viewable by everyone" ON stories
    FOR SELECT USING (visibility = 'PUBLIC');

CREATE POLICY "Public tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Public instagram content is viewable by everyone" ON instagram_content
    FOR SELECT USING (true);

CREATE POLICY "Public junction trip_places viewable" ON trip_places FOR SELECT USING (true);
CREATE POLICY "Public junction day_places viewable" ON day_places FOR SELECT USING (true);
CREATE POLICY "Public junction memory_tags viewable" ON memory_tags FOR SELECT USING (true);
CREATE POLICY "Public junction media_tags viewable" ON media_tags FOR SELECT USING (true);
CREATE POLICY "Public junction story_media viewable" ON story_media FOR SELECT USING (true);
CREATE POLICY "Public junction story_places viewable" ON story_places FOR SELECT USING (true);
CREATE POLICY "Public junction story_trips viewable" ON story_trips FOR SELECT USING (true);
CREATE POLICY "Public junction instagram links viewable" ON instagram_content_links FOR SELECT USING (true);

-- AUTHENTICATED FULL ACCESS POLICIES (Studio Operator)
CREATE POLICY "Authenticated user has full access to trips" ON trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to days" ON days FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to places" ON places FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to memories" ON memories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to media" ON media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to stories" ON stories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to tags" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to instagram" ON instagram_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to trip_places" ON trip_places FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to day_places" ON day_places FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to memory_tags" ON memory_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to media_tags" ON media_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to story_media" ON story_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to story_places" ON story_places FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to story_trips" ON story_trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated user has full access to instagram links" ON instagram_content_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
