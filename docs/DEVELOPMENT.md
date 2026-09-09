# LOCAL DEVELOPMENT GUIDE — THE JAYANT DIARIES

This guide details the steps to set up, develop, test, and run **The Jayant Diaries** locally.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or later (tested on Node `25.x`)
- **npm**: `10.x` or later
- **Git**: `2.x` or later
- **Supabase CLI** (optional, for local emulation): `brew install supabase/tap/supabase`

---

## 2. Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/JayantOlhyan/The-Jayant-Diaries.git
cd The-Jayant-Diaries

# 2. Install dependencies
npm install

# 3. Create local environment configuration
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

---

## 3. Database & Migrations Workflow

Database migrations are located in `supabase/migrations/` and follow the timestamp format `YYYYMMDDHHMMSS_name.sql`.

### Applying Migrations
Using Supabase CLI:
```bash
# Link local CLI to your remote project (one-time)
supabase link --project-ref your-project-ref

# Push migrations to database
supabase db push
```

Alternatively, apply the SQL file directly via psql or Supabase SQL Editor:
```bash
psql $DATABASE_URL -f supabase/migrations/20260909000000_initial_schema.sql
```

---

## 4. Development Server

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public site.  
Open [http://localhost:3000/studio](http://localhost:3000/studio) to view the private Studio.

---

## 5. Verification & Quality Gates

Run the verification suite before committing any changes:

```bash
# 1. Typecheck TypeScript files
npm run typecheck

# 2. Lint JavaScript/TypeScript files
npm run lint

# 3. Run unit & integration test suites
npm run test

# 4. Verify production build
npm run build
```

---

## 6. Code Architecture Conventions

- **Server vs Client**:
  - Always default to Server Components.
  - Add `'use client'` only when attaching event handlers, local interactive UI state, or browser APIs.
- **Data Access**:
  - Do not write raw queries in UI components. Always use repository methods in `src/server/repositories/`.
- **Validation**:
  - All form submissions, Server Actions, and API route inputs must be validated with Zod schemas in `src/lib/validation/`.
