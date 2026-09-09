# THE JAYANT DIARIES
## MASTER PRD + STAGE 0 PROJECT BOOTSTRAP SPECIFICATION

**Repository:** `https://github.com/JayantOlhyan/The-Jayant-Diaries.git`  
**Default branch:** `main`  
**Project:** The Jayant Diaries  
**Instagram:** `@the_jayant_diaries`  

---

# 0. AGENT ROLE

You are the **principal software architect, product engineer, UX engineer, and technical owner** for this project.

You are not being asked to immediately build a visually impressive website.

Your first responsibility is to establish a **production-grade foundation** for a long-lived personal travel archive.

You must think in this order:

**Product → Architecture → Data → Workflow → UX → Implementation → Validation**

Do not start by building the homepage.

Do not invent requirements that conflict with this document.

Do not introduce infrastructure merely because it is technically interesting.

Every architectural decision must be explainable in terms of one of these goals:

1. Preserve the travel archive for years.
2. Minimize manual archival work.
3. Make the public experience cinematic.
4. Keep data ownership under the project owner’s control.
5. Keep the system maintainable by one developer.
6. Avoid unnecessary complexity.

---

# 1. PRODUCT DEFINITION

## 1.1 What this product is

**The Jayant Diaries** is a personal digital travel archive that transforms scattered photographs, videos, journals, places, memories and Instagram posts into structured cinematic journeys.

The conceptual model is:

**Netflix for Jayant’s memories**

but the system behaves like:

**a structured personal travel database**

and the public frontend feels like:

**a premium travel documentary.**

---

# 2. CORE PRODUCT PRINCIPLE

The fundamental distinction is:

> **Instagram shows the moments. The Jayant Diaries stores the journey.**

Instagram is a distribution channel.

The website/database is the canonical archive.

The application must continue functioning even if Instagram changes its API, disappears, or becomes unavailable.

Never make Instagram the system of record.

---

# 3. CORE PRODUCT LOOP

Everything in the system should reinforce:

**TRAVEL → CAPTURE → UPLOAD → ORGANIZE → ARCHIVE → PUBLISH → REMEMBER**

A proposed feature that does not strengthen this loop should be treated as a candidate for rejection.

---

# 4. PRIMARY USER

The primary user is Jayant.

The system must allow him to:

* Create trips
* Create days within trips
* Add places
* Write memories
* Write journals
* Upload large batches of media
* Organize media
* Attach Instagram posts/reels
* Search the archive
* Browse the archive on a map
* Control visibility
* Publish selected content
* Revisit old trips quickly

The product must minimize administrative overhead.

---

# 5. PUBLIC USER

Public visitors should be able to:

* Discover journeys
* Explore destinations
* Browse places
* View photographs
* Watch videos
* Read stories
* Experience journeys
* Explore the map
* Find related journeys
* Open Instagram content
* Understand the larger context behind a post

The public user must never need access to the Studio.

---

# 6. PRODUCT PHILOSOPHY

Avoid building a literal Netflix clone.

Netflix provides inspiration for:

* cinematic hero sections
* horizontal content rails
* immersive media
* large cards
* recommendation-like discovery
* continuation metaphors

But the information architecture is fundamentally different.

Netflix answers:

> What should I watch?

The Jayant Diaries answers:

> Where have I been, what happened there, and what do I remember?

---

# 7. CRITICAL UX RULE

The most important workflow rule is:

> **Do not make archival work feel like database administration.**

### Bad
Upload photo → choose trip → choose day → choose place → choose date → choose tags → choose memory → choose visibility → save

### Good
Upload 147 files → extract metadata → group by date → detect GPS → suggest trip → suggest day → suggest place → detect duplicates → present review screen → approve / modify → archive

Automation should remove bureaucracy.  
AI can suggest.  
AI must not silently rewrite or reorganize the canonical archive.  
Human approval remains the final authority.

---

# 8. SOURCE OF TRUTH

The canonical source of truth is the project database and object storage.

Instagram content is an external reference.

Do not design the application such that:

* removing an Instagram post deletes a trip
* Instagram API downtime breaks trip pages
* public archive pages depend on scraping Instagram
* media is recoverable only through Instagram

---

# 9. INFORMATION ARCHITECTURE

The core hierarchy is:

**TRIP → DAYS → PLACES → MEMORIES → MEDIA**

Instagram content is associated with these entities.

This hierarchy must be reflected in:

* database relationships
* Studio workflows
* public navigation
* URLs
* search
* filters
* map relationships

---

# 10. CORE DATA ENTITIES

### 10.1 Trip
- id, title, slug, description, cover_media_id, start_date, end_date, status, featured, visibility, created_at, updated_at

### 10.2 Day
- id, trip_id, day_number, date, title, description, cover_media_id, journal, location metadata, created_at, updated_at

### 10.3 Place
- id, name, slug, country, state, city, latitude, longitude, description, cover_media_id, created_at, updated_at

### 10.4 Memory
- id, title, description, journal, date, trip_id, day_id, place_id, featured, visibility, created_at, updated_at

### 10.5 Media
- id, filename, storage_path, storage_url, thumbnail_url, type, mime_type, width, height, duration, taken_at, latitude, longitude, trip_id, day_id, place_id, memory_id, caption, visibility, created_at, updated_at
- Supported types: PHOTO, VIDEO, REEL, STORY, AUDIO, DOCUMENT

### 10.6 Instagram Content
- id, instagram_url, shortcode, type (POST, REEL, CAROUSEL), caption, published_at, thumbnail_url, trip_id, day_id, place_id, featured, created_at, updated_at

### 10.7 Tags
- id, name, slug, created_at

---

# 11. VISIBILITY MODEL

- **PUBLIC**: Visible on public pages, searchable, indexable.
- **UNLISTED**: Accessible via direct URL, not surfaced in discovery, not indexed.
- **PRIVATE**: Studio-only. Never exposed to public SSR/API/search engines.

---

# 12. PUBLIC ROUTES

```text
/
/journeys
/journeys/[slug]
/destinations
/destinations/[slug]
/places
/places/[slug]
/stories
/stories/[slug]
/media
/map
/about
```

---

# 13. PRIVATE STUDIO ROUTES

```text
/studio
/studio/dashboard
/studio/trips
/studio/trips/new
/studio/trips/[id]
/studio/trips/[id]/edit
/studio/days
/studio/places
/studio/memories
/studio/media
/studio/instagram
/studio/map
/studio/tags
/studio/settings
```

---

# 14–26. KEY SPECIFICATIONS SUMMARY

- **Design System**: Dark, cinematic, editorial, minimal, image-heavy for public site; functional, readable, efficient for Studio.
- **Technical Stack**: Next.js 15 (App Router, Server Actions, Route Handlers), TypeScript, Tailwind CSS, PostgreSQL via Supabase, Supabase Auth & Storage, Vercel deployment.
- **Architecture**: Modular monolith maintained by one developer. Avoid premature microservices.
- **Data Ownership**: Fully exportable relational data and object storage.
- **Performance**: Pagination, responsive image optimization, indexing, lazy loading.
- **Security**: Server-side authorization, RLS policies, input validation with Zod, sanitized rich text.
