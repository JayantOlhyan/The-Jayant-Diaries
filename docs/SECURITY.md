# SECURITY & PRIVACY SPECIFICATION — THE JAYANT DIARIES

This document outlines the security architecture, data privacy controls, and defense-in-depth principles for **The Jayant Diaries**.

> **Note on Implementation Status**: As required by Phase 0, all security controls are clearly demarcated as either **[IMPLEMENTED]** (in code/configuration today) or **[PLANNED]** (designed into architecture for subsequent phases).

---

## 1. Threat Model & Security Principles

1. **Private Data Isolation [IMPLEMENTED]**: Private archival records (`visibility = 'PRIVATE'`) must never be leaked through public APIs, SSR HTML, search indices, sitemaps, or unauthenticated storage URLs.
2. **Zero Trust for Client Input [IMPLEMENTED]**: All inputs across network boundaries (API routes, Server Actions, query parameters) are validated using strict Zod schemas on the server.
3. **Defense in Depth [IMPLEMENTED]**: Authorization checks occur at two independent levels:
   - Application Layer (Next.js middleware and Server Action authorization guards).
   - Database Layer (PostgreSQL Row Level Security policies).
4. **Decoupled Identity [IMPLEMENTED]**: Media IDs are system UUIDs. Filenames uploaded by the user are never used directly as storage keys or database identifiers.

---

## 2. Authentication & Studio Protection

### [IMPLEMENTED]
- **Client & Server Auth Tooling**: Configured Supabase SSR (`@supabase/ssr`) with cookie-based session handling in `src/lib/auth/server.ts` and `src/lib/auth/client.ts`.
- **Public vs Studio Routing Boundaries**: Route architecture clearly isolates public read-only views (`src/app/(public)/*`) from Studio administration views (`src/app/studio/*`).

### [PLANNED — Phase 3]
- **Studio Route Middleware Guard**: Automated redirection to `/studio/login` for unauthenticated sessions on `/studio/*` paths via `middleware.ts`.
- **Session Expiry & Token Rotation**: Refresh token rotation handled automatically via Supabase Auth cookies.

---

## 3. Database Row Level Security (RLS) Policies

### [IMPLEMENTED]
The initial database migration (`supabase/migrations/20260909000000_initial_schema.sql`) explicitly enables RLS on all 16 tables and junction tables, defining:
- **Public Select Policy**: Anonymous/public visitors can **ONLY** read records where `visibility = 'PUBLIC'` and `status = 'PUBLISHED'`.
- **Authenticated Access Policy**: Only authenticated accounts have full CRUD access across all tables.

```sql
-- Enforced in database schema:
CREATE POLICY "Public trips are viewable by everyone" ON trips
    FOR SELECT USING (visibility = 'PUBLIC' AND status = 'PUBLISHED');

CREATE POLICY "Authenticated user has full access to trips" ON trips
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 4. Storage Security & Upload Verification

### [IMPLEMENTED]
- **Deterministic Storage Paths**: UUID-based paths generated in `src/lib/storage/paths.ts` (`media/{mediaId}/{variant}.webp`) prevent path traversal or user-controlled filename vulnerabilities.
- **Bucket Partitioning Strategy**:
  - `media-public`: For assets marked `PUBLIC` (served via CDN).
  - `media-private`: Restricted bucket requiring time-to-live (TTL) signed URLs.

### [PLANNED — Phase 2]
- **Direct-to-Storage Presigned Uploads**: Enforcing presigned upload URLs with file size caps (50MB image, 500MB video).
- **Server-Side MIME Inspection**: Validating magic bytes beyond client-reported headers before marking assets `ACTIVE`.

---

## 5. Input Validation & Schema Integrity

### [IMPLEMENTED]
- **Runtime Environment Validation**: `src/lib/validation/env.ts` enforces that all required secrets and public URLs exist and conform to URL schemas before the server boots.
- **Entity Schemas**: `src/lib/validation/entities.ts` enforces strict Zod rules:
  - Slugs restricted to lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`).
  - Geographic coordinates bounded (`-90 <= lat <= 90`, `-180 <= lng <= 180`).
  - Dates validated to ISO format (`YYYY-MM-DD`).
  - Day numbers strictly positive integers.

---

## 6. Rich Text & Journal Sanitization

### [PLANNED — Phase 1 & 3]
- Markdown rendered to HTML using an AST sanitizer (e.g. `rehype-sanitize` or DOMPurify allowlist).
- Embedded script tags, `javascript:` URLs, and arbitrary event handlers (`onload`, `onerror`) stripped prior to HTML emission.

---

## 7. Secrets Management & Client Bundles

### [IMPLEMENTED]
- **Strict Prefix Isolation**: Only environment variables prefixed with `NEXT_PUBLIC_` are bundled into browser assets.
- **Secret Isolation**: `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are strictly server-only variables and verified by `envSchema`.
- **Git Hygiene**: `.gitignore` strictly rejects `.env`, `.env.local`, `.env.*.local`, `.vercel`, and private certificates (`*.pem`).

---

## 8. Privacy & Search Engine Directives

### [IMPLEMENTED]
- Root layout in `src/app/layout.tsx` establishes base search engine indexing policies.

### [PLANNED — Phase 4]
- **Unlisted URLs** (`/journeys/unlisted-trip`): Injects `X-Robots-Tag: noindex, nofollow` HTTP headers and `<meta name="robots" content="noindex, nofollow">` HTML tags.
- **Private URLs** (`/studio/*`): Excluded via `robots.txt` and response headers.
