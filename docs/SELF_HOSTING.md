# Self-Hosting Guide for The Jayant Diaries

This guide provides step-by-step instructions for deploying and self-hosting your own instance of the travel archive.

---

## 1. Prerequisites

- **Node.js**: Version 20.x or higher
- **Database**: PostgreSQL (managed via Supabase or self-hosted PostgreSQL)
- **Object Storage**: S3-compatible or Supabase Storage bucket named `media`
- **Hosting Platform**: Vercel, Netlify, or any standard Node.js server container

---

## 2. Database Setup

1. **Create a Supabase Project**:
   Create a new project at [supabase.com](https://supabase.com).

2. **Execute Schema Migrations**:
   Run the migration files located in `supabase/migrations/` sequentially using the Supabase SQL Editor or Supabase CLI:
   - Initial schemas (`trips`, `days`, `places`, `media`, `memories`, `stories`)
   - Indexes and constraints
   - Row Level Security (RLS) policies

3. **Storage Bucket**:
   Create a bucket named `media`:
   - Set public read access for transformed preview assets.
   - Restrict original full-resolution media according to your archival preference.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your project credentials:

| Variable | Description | Client Exposed |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical website domain (e.g., `https://your-domain.com`) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client operations | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative key for server operations (keep secret!) | No |
| `DATABASE_URL` | Direct connection pooler string | No |

---

## 4. Building & Running

### Development Mode
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

---

## 5. Security Guardrails

- **RLS Verification**: Ensure Row Level Security is enabled on all tables.
- **Private Data Protection**: Only items with `visibility = 'PUBLIC'` and `status = 'PUBLISHED'` are served on public pages.
- **Studio Route Protection**: Protect `/studio/*` behind Supabase Auth session checks or basic auth on private deployments.
