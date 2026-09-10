# DEPLOYMENT & PRODUCTION RUNBOOK — THE JAYANT DIARIES

This document describes the production deployment process, environment configuration, database migrations, and operational recovery procedures for **The Jayant Diaries**.

---

## 1. Production Architecture Overview

- **Hosting Platform**: Vercel (Edge & Serverless Node.js runtime)
- **Database & Storage**: Supabase (PostgreSQL 16+ & S3-compatible Object Storage)
- **CDN**: Vercel Edge Network + Supabase Storage Global CDN
- **Canonical Domain**: `https://thejayantdiaries.com`

---

## 2. Vercel Deployment Setup

### Step 1: Connect GitHub Repository
1. Import `https://github.com/JayantOlhyan/The-Jayant-Diaries.git` into Vercel.
2. Framework preset: **Next.js**.
3. Root directory: `./`.
4. Build command: `npm run build`.
5. Output directory: `.next`.

### Step 2: Configure Environment Variables
Set the following environment variables in the Vercel Dashboard (Settings → Environment Variables):

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Production / Preview | `https://thejayantdiaries.com` (or preview URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | All | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Browser public anonymous JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Secret server-only role key |
| `DATABASE_URL` | All | PostgreSQL pooled connection string |
| `NEXT_PUBLIC_MAP_PROVIDER_KEY` | All | Mapbox GL or Google Maps token |

---

## 3. Database Migration Deployment Procedure

Migrations must be run **before** deploying new application versions that depend on schema changes.

```bash
# 1. Test migration locally or in staging branch
supabase db push --dry-run

# 2. Apply migration to production Supabase project
supabase db push --linked
```

Or via direct PostgreSQL client:
```bash
# Apply Phase 11 Import Sessions migration
psql $DATABASE_URL -f supabase/migrations/20260911000000_import_sessions.sql
```

### Applied Migrations Inventory
- `20260601000000_initial_schema.sql`: Core relational tables (`trips`, `days`, `places`, `media`, `memories`, `stories`, `tags`).
- `20260715000000_storage_and_indices.sql`: Deterministic storage paths, RLS policies, and performance indices.
- `20260911000000_import_sessions.sql`: Import sessions (`import_sessions`), item-level execution log (`import_session_items`), and `media.import_session_id` link.

---

## 4. Storage Bucket Configuration

Ensure the following buckets are configured in the Supabase Dashboard:
1. `media-public`:
   - Public bucket: **Enabled**
   - Allowed MIME types: `image/*`, `video/*`, `audio/*`, `application/pdf`
   - Max file size: 500 MB
2. `media-private`:
   - Public bucket: **Disabled** (Requires authenticated/signed download URLs)
   - Max file size: 500 MB

---

## 5. Post-Deployment Verification Checklist

1. [ ] Health check endpoint responds: `GET /api/health` returns `200 OK`.
2. [ ] Public home page renders without hydration mismatch: `GET /`.
3. [ ] Studio route redirects unauthenticated users: `GET /studio` -> `307 /studio/login`.
4. [ ] Media CDN serves cached webp images.
5. [ ] SSL certificates active and enforcing HTTPS.
6. [ ] Robots.txt restricts studio paths and sitemap is accessible at `/sitemap.xml`.

---

## 6. Backup, Recovery & Source of Truth

### Source of Truth Architecture
1. **Canonical Relational Data**: PostgreSQL database hosted on Supabase (`trips`, `days`, `places`, `memories`, `media`, `stories`, `tags`).
2. **Canonical Binary Assets**: Supabase Storage buckets (`media-private` for master archival originals, `media-public` for published assets).
3. **Application Logic & Schema Definition**: Git repository (`main` branch) and `supabase/migrations/`.
4. **Environment Configuration**: Secrets and deployment variables stored securely in hosting environment (Vercel Dashboard / Supabase Vault).

### Backup Dependencies & Policy
- **What Must Be Backed Up Regularly**:
  - **Supabase Postgres Database**: Full daily pg_dump automated backups + Point-In-Time Recovery (PITR) enabled.
  - **Supabase Storage Master Bucket (`media-private`)**: Primary archival copies of original photography, videos, and media binaries.
- **What Is Reconstructable**:
  - Derived image thumbnails and webp derivatives (can be regenerated from `media-private` originals).
  - Search indices (rebuilt dynamically from PostgreSQL records).
  - Static pages and sitemaps (generated on-demand or at build time).
- **What Must Never Be Deleted**:
  - Master records in `media-private` storage.
  - Historical migration SQL scripts in `supabase/migrations/`.

### Rollback & Disaster Recovery Procedures
- **Application Rollback**: In Vercel Dashboard → Deployments, select the prior stable deployment SHA and click **Instant Rollback**.
- **Database Point-In-Time Recovery (PITR)**: In Supabase Dashboard → Settings → Database Backups, initiate PITR restoration to the target timestamp before incident.
