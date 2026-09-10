# ARCHITECTURE BLUEPRINT — THE JAYANT DIARIES

## 1. System Overview

**The Jayant Diaries** is architected as a **modular monolith** running on Next.js 15 App Router, backed by PostgreSQL and S3-compatible Object Storage (Supabase), deployed to Vercel.

The design prioritizes:
1. **Long-term archive preservation**: Canonical relational models and content portability.
2. **Single-operator maintainability**: Zero microservice overhead, unified TypeScript codebase.
3. **Cinematic presentation**: Ultra-fast SSR/ISR public delivery with progressive media hydration.
4. **Absolute data ownership**: Decoupled from third-party social platforms (Instagram).

```
                      +-----------------------------+
                      |       Public Visitor        |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Next.js App Router (SSR)  |
                      |   /(public)/* (Dark Cinema) |
                      +--------------+--------------+
                                     |
        +----------------------------+----------------------------+
        |                                                         |
        v                                                         v
+-------------------------------+                         +-------------------------------+
|     Studio Operator (Jayant)  |                         |    API / Route Handlers       |
|     /studio/* (Studio UI)     |                         |    /api/*                     |
+---------------+---------------+                         +---------------+---------------+
                |                                                         |
                +----------------------------+----------------------------+
                                             |
                                             v
                      +-------------------------------------------+
                      |         Application Service Layer         |
                      |         src/server/services/*             |
                      +----------------------+--------------------+
                                             |
                                             v
                      +-------------------------------------------+
                      |         Repository Data Access            |
                      |         src/server/repositories/*         |
                      +----------------------+--------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
+------------------------------------+               +------------------------------------+
|        PostgreSQL Database         |               |          Supabase Storage          |
|    - Normal Relational Schema      |               |    - Deterministic Media Paths     |
|    - Row Level Security (RLS)      |               |    - Responsive Image CDN          |
|    - Full-Text Search (tsvector)   |               |    - Authenticated Uploads         |
+------------------------------------+               +------------------------------------+
```

---

## 2. Why Modular Monolith?

We deliberately reject microservices, standalone Node/FastAPI backends, and external queue orchestrators for the following fundamental architectural reasons:

- **Single Developer Footprint**: A personal archive must be maintainable by one developer without DevOps friction or polyglot mental overhead.
- **Transactional Relational Integrity**: Operations such as assigning 100 media assets to a day, trip, and places benefit directly from ACID transactions in PostgreSQL.
- **Zero Serialization Latency**: Next.js Server Components query data repositories directly on the server without internal HTTP network hops.
- **Cost Efficiency & Longevity**: A serverless Next.js deployment connected to managed PostgreSQL and object storage incurs near-zero idle cost and can run unattended for years.

---

## 3. Application Layers & Directory Mapping

The application enforces a strict unidirectional dependency structure:

1. **Presentation Layer (`src/app/`, `src/components/`)**:
   - `src/app/(public)/*`: Server Components rendering public editorial and cinematic layouts. Zero admin code or private queries allowed.
   - `src/app/studio/*`: Authenticated Studio dashboards, batch upload drawers, editing forms.
   - `src/components/ui/*`: Primitive, accessible design-token driven components.
   - `src/components/public/*`: Cinematic hero sections, horizontal rails, lightbox galleries.
   - `src/components/studio/*`: Operational tables, batch processors, metadata review grids.
2. **Domain Features Layer (`src/features/*`)**:
   - Organizes components, hooks, and types by product domain (`trips`, `days`, `places`, `memories`, `media`, `instagram`, `stories`, `search`).
3. **Application Service Layer (`src/server/services/*`)**:
   - Implements business logic: batch media ingestion, metadata extraction orchestration, duplicate detection coordination, trip publishing pipelines.
4. **Repository Layer (`src/server/repositories/*`)**:
   - Single point of contact with PostgreSQL. Encapsulates SQL queries and Supabase database clients. Enforces visibility filters.
5. **Infrastructure & Shared Utilities (`src/lib/`)**:
   - `lib/db/`: Database clients and connection pooling.
   - `lib/storage/`: S3/Supabase upload handlers and path generators.
   - `lib/auth/`: Supabase Auth session verifiers and middleware.
   - `lib/maps/`: Provider-agnostic map coordinate and marker abstractions.
   - `lib/validation/`: Zod schemas for all network and database boundaries.

---

## 4. Server vs. Client Boundary Rules

- **Server Components (Default)**:
  - All data fetching for public pages and initial Studio dashboards occurs in Server Components.
  - No client JavaScript overhead for reading journeys, places, stories, or metadata.
- **Client Components (`'use client'`)**:
  - Reserved strictly for:
    - User interactivity (interactive map explorer, video playback controls, lightbox gestures).
    - Batch drag-and-drop file uploaders.
    - Studio interactive state (filtering, inline editing, modals, drawers).
- **Server Actions**:
  - Mutation endpoints (`createTrip`, `updateDay`, `saveJournal`, `batchTagMedia`).
  - Automatically validated with Zod before database execution.
  - Revalidate Next.js cache paths (`revalidatePath`) upon successful mutation.

---

## 5. Storage Architecture & Deterministic Paths

Media assets are stored in Supabase Storage with deterministic, UUID-based path conventions to prevent human-naming conflicts or broken relations:

```text
media/
└── {mediaId}/
    ├── original.{ext}      # Canonical unmodified uploaded file
    ├── large.webp          # 2560px cinematic hero view
    ├── medium.webp         # 1280px standard editorial view
    ├── small.webp          # 640px mobile & card rail view
    └── thumbnail.webp      # 320px studio grid & preview thumbnail
```

### Media Pipeline Lifecycle
1. **Direct-to-Storage Upload**: Client requests a signed upload URL via Server Action, uploading large files directly to Supabase Storage without burdening the Next.js serverless process.
2. **Metadata Extraction**: Client/Server extracts EXIF/IPTC data (timestamp, GPS latitude/longitude, camera model, dimensions).
3. **Media Record Insertion**: An unorganized `media` record is created in PostgreSQL with status `UNASSIGNED`.
4. **Review & Attachment**: Jayant reviews suggested grouping in Studio, modifying or confirming trip/day/place/memory associations.

---

## 6. Authentication & Authorization Model

- **Public Visitors**:
  - No authentication required.
  - Restricted strictly to `visibility = 'PUBLIC'` and `status = 'PUBLISHED'` records.
  - Database Row Level Security (RLS) automatically blocks anonymous access to `PRIVATE` or `UNLISTED` records.
- **Studio Operator (Jayant)**:
  - Authenticated via Supabase Auth (Email + Secure Password, optional OAuth).
  - Next.js middleware (`src/middleware.ts`) protects all `/studio/*` routes, redirecting unauthenticated requests to login.
  - Service Role Key is used strictly in protected server contexts where admin operations (e.g. storage management or migration jobs) are required. It is NEVER exposed to the browser.

---

## 7. Search & Discovery Architecture

- **PostgreSQL Full-Text Search**:
  - Generated `tsvector` columns with `GIN` indexing across `trips`, `places`, `memories`, `stories`, and `tags`.
  - Supports prefix matching, geographic filtering, and tag composition in sub-millisecond query times without running an Elasticsearch cluster.
- **Future Expansion**:
  - Embeddings (pgvector) can be introduced in Phase 7 for semantic memory queries directly within the same database.

---

## 8. Geographic Archive & Map Architecture (Phase 6)

- **Technology**: Leaflet 1.9 with CartoDB Dark Matter tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
- **Zero API Key Overhead**: Uses open CartoDB Dark Matter basemap matching the dark cinema aesthetic (`#0B0D0E`) without requiring third-party SaaS tokens, credit cards, or external map subscription fees.
- **Dynamic Client Loading**: Leaflet and its CSS are strictly loaded on-demand via `next/dynamic` (`ssr: false`) inside `/map` to ensure zero bundle overhead on non-map routes.
- **Strict Coordinate Validation**: All coordinates are validated through `isValidCoordinate()` (finite, numbers, `[-90, 90]` lat, `[-180, 180]` lng). Places with invalid or missing coordinates are gracefully omitted from the public map canvas and flagged in Studio.
- **Relational Integrity & Zero Inferred Matching**: Place-to-journey relationships are resolved strictly from explicit relations (Days, Memories, Media). No textual or name-based heuristics are permitted.
- **Absolute Privacy Boundary**:
  - `PUBLIC` places with valid coordinates render on `/map`.
  - `PRIVATE` or `UNLISTED` places never leak to map props or `/api/map`.
  - Related journeys shown on place cards only include `PUBLIC` and `PUBLISHED` trips.
- **Routes**:
  - `/(public)/map`: Interactive atlas with canonical URL filtering (`/map?journey=...`).
  - `/api/map`: Minimal, sanitized public geographic JSON endpoint.
  - `/studio/map`: Operational audit view displaying mapped/unmapped place counts and coordinate coverage.

---

## 9. Smart Archive Ingestion & Media Organization Architecture (Phase 7)

Phase 7 introduces the operational ingest pipeline to transform raw travel photos and videos into organized archive records without manual data entry burden or AI hallucinations.

```text
+-----------------------+
|   Raw Media Files     |  (JPG, PNG, WEBP, HEIC, MP4, MOV)
+-----------+-----------+
            |
            v
+-----------------------+
|  Deterministic Parser |  (exifr + Web Crypto API)
|  - EXIF Timestamp     |
|  - GPS Coordinates    |
|  - SHA-256 Hash       |
+-----------+-----------+
            |
            +------------------------------------+
            |                                    |
            v                                    v
+-----------------------+            +-----------------------+
| Suggestion Engine     |            |  Duplicate Detection  |
| - Trip: Date Range    |            |  - Database Hash Match|
| - Day: Date Match     |            |  - Intra-Batch Match  |
| - Place: Haversine    |            |  - Non-destructive    |
|   (Proximity <= 15km) |            +-----------+-----------+
+-----------+-----------+                        |
            |                                    |
            +-----------------+------------------+
                              |
                              v
            +------------------------------------+
            |      Studio Operator Review        |
            |      /studio/import                |
            |      - Date Grouping Timeline      |
            |      - Bulk Assignments            |
            |      - Technical EXIF Inspector    |
            |      - Human Approval Gate         |
            +-----------------+------------------+
                              |
                              v
            +------------------------------------+
            |   Server Action (Batch Archival)   |
            |   - Referential Integrity Check    |
            |   - Coordinate Bounds Check        |
            |   - Default: visibility='PRIVATE'  |
            +------------------------------------+
```

### Deterministic Principles & Invariants
1. **Mathematical Suggestions Only**:
   - **Trip**: Media capture date falls within `trip.start_date` and `trip.end_date`.
   - **Day**: Media capture date matches `day.date`.
   - **Place**: Media GPS coordinates within 15 km of known place coordinates via the Haversine formula (`calculateDistanceKm`).
   - **Anti-Hallucination Invariant**: Filename text is strictly forbidden for inferring location or journey.
2. **Duplicate Prevention**:
   - Every file is fingerprinted using deterministic SHA-256 content hashing.
   - Exact duplicates in the canonical archive or current batch are highlighted for review. Existing records are never automatically deleted or overwritten.
3. **Strict Privacy Invariant**:
   - All newly ingested media assets are assigned `visibility = 'PRIVATE'` by default. Uploading does not equal publishing.
4. **Operational Efficiency**:
   - Chronological date grouping (`groupItemsByDate`) aggregates days into manageable batches for bulk assignment.
   - Floating batch action toolbar allows mass assignment of Trip, Day, and Place with instant verification.

---

## 11. Intelligent Archive Capture & Import Pipeline (Phase 11)

Phase 11 introduces a high-throughput, resilient operational pipeline for importing real-world media batches into the archive while upholding the core principle: **Automation may organize data, but it must never invent truth.**

```text
REAL-WORLD MEDIA
       ↓
IMPORT SESSION (Context: Title, Default Trip/Day)
       ↓
EXTRACT METADATA (EXIF, GPS, Taken Date, Dimensions, MIME)
       ↓
CONTENT HASH (SHA-256)
       ↓
DUPLICATE CHECK (Against Archive DB & Batch)
       ↓
DETERMINISTIC SUGGESTIONS (Trip range, Day date, Proximity candidates up to 25km)
       ↓
OPERATOR REVIEW & SMART GROUPING (Bounded Pagination, Place/Type/Status Groups)
       ↓
ARCHIVE (media.visibility = 'PRIVATE', itemized session audit)
       ↓
CURATION HANDOFF (/studio/archive?trip=...)
```

### Key Components & Invariants
1. **Import Session Model**:
   - `import_sessions`: Groups batch operations with lifecycle status (`CREATED` → `PROCESSING` → `COMPLETED` / `REVIEW_REQUIRED` / `FAILED` / `CANCELLED`) and truthful metrics (`total_files`, `processed_files`, `successful_files`, `duplicate_files`, `failed_files`).
   - `import_session_items`: Item-level transaction log recording file-by-file outcomes (`QUEUED`, `PROCESSING`, `SUCCESS`, `DUPLICATE`, `FAILED`) and specific actionable error reasons.
   - `media.import_session_id`: Referential foreign key linking archived assets back to their originating import session for auditability.
2. **Resumable Imports & Selective Retry**:
   - In large batches, failures are isolated to the specific file.
   - Retrying a session resets only `FAILED` items to `QUEUED`. Successful uploads and confirmed duplicates are never unnecessarily reprocessed.
3. **Bounded DOM & Large Batch Handling**:
   - Client workspace uses bounded pagination (48 items per page) and Smart Grouping (by Place, Media Type, or Status) to ensure smooth 60fps performance on 100–500 file batches.
4. **Candidate GPS Proximity Suggestions**:
   - EXIF GPS coordinates evaluate known places within 25 km, presenting ranked candidates with exact distances (e.g. Pangong Lake 12.4 km vs Spangmik Village 14.1 km).
   - Suggestions remain strictly labelled `SUGGESTED`; human operator confirmation is required before assignment.
5. **Direct Pipeline Integration**:
   - Successful imports seamlessly offer direct handoff to Archive Curation (`/studio/archive?trip=...`) and Import History (`/studio/imports/[id]`).

---

## 12. Backup & Disaster Recovery Strategy

Because this is a permanent lifetime archive:
1. **Database**: Nightly automated logical backups via Supabase + point-in-time recovery (PITR). An export script (`npm run archive:export`) dumps canonical JSON schemas and journals.
2. **Storage**: Supabase Storage buckets mirrored or synced to secondary cold storage (AWS S3 Glacier or Cloudflare R2).
3. **Code & Configuration**: Source code hosted on GitHub; all schema definitions version-controlled in `supabase/migrations/`.
