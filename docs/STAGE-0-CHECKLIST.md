# STAGE 0 ACCEPTANCE CHECKLIST — THE JAYANT DIARIES

This checklist validates the completion of **Stage 0 — Project Bootstrap & Architectural Foundation** before proceeding to Phase 1 (Archive Engine).

---

## 1. Repository Foundation
- [x] Repository structure initialized with strict directory boundaries.
- [x] Main branch conventions established.
- [x] `README.md` created with project philosophy, tech stack, and documentation index.
- [x] `.gitignore` configured to prevent leaking `.env*`, `.next`, `node_modules`, and OS files.
- [x] `.env.example` created with comprehensive documentation of every required environment variable.

---

## 2. Application Architecture & Tooling
- [x] Next.js 15 App Router configured with strict TypeScript compiler options.
- [x] Tailwind CSS configured with cinematic public tokens and operational studio tokens.
- [x] PostCSS and Autoprefixer integrated.
- [x] ESLint configuration established with `next/core-web-vitals`.
- [x] Vitest testing environment configured with path aliases and jsdom.
- [x] Canonical build, test, lint, and typecheck scripts configured in `package.json`.

---

## 3. Documentation Suite
- [x] `docs/PRD.md`: Canonical Master Product Requirements Document stored in repository.
- [x] `docs/ARCHITECTURE.md`: Modular monolith rationale, system layers, and boundaries documented.
- [x] `docs/DATA_MODEL.md`: Full relational schema, enums, indexes, deletion rules, and Mermaid ERD documented.
- [x] `docs/SECURITY.md`: Supabase Auth, RLS policies, storage rules, and threat mitigation documented.
- [x] `docs/DEVELOPMENT.md`: Step-by-step developer onboarding instructions documented.
- [x] `docs/DEPLOYMENT.md`: Production runbook for Vercel, Supabase, and rollback plans documented.
- [x] `docs/CONTRIBUTING.md`: Git branch naming, Conventional Commits, and PR rules documented.
- [x] `AGENTS.md`: Strict operational contract and quality gates for AI coding agents documented.

---

## 4. Database & Relational Schema
- [x] PostgreSQL migration strategy established (`supabase/migrations/`).
- [x] Initial migration created (`20260909000000_initial_schema.sql`):
  - [x] Core entities: `places`, `trips`, `days`, `memories`, `media`, `instagram_content`, `tags`, `stories`.
  - [x] Junction tables: `trip_places`, `day_places`, `memory_tags`, `media_tags`, `story_media`, `story_places`, `story_trips`, `instagram_content_links`.
  - [x] Enums: `visibility_type`, `trip_status`, `media_type`, `instagram_type`.
  - [x] Foreign keys with non-destructive deletion policies (`ON DELETE SET NULL` for media/memories).
  - [x] Performance indexes on foreign keys, slugs, dates, and full-text search `tsvector`.
  - [x] Row Level Security (RLS) enabled on all tables with explicit public/private policies.
- [x] TypeScript database definitions (`src/types/database.ts`) generated to mirror schema.
- [x] Domain entity types (`src/types/entities.ts`) established.

---

## 5. Storage & Media Foundation
- [x] Deterministic storage path convention defined: `media/{mediaId}/{variant}.{ext}`.
- [x] Path generation and parsing utilities implemented (`src/lib/storage/paths.ts`).
- [x] Public CDN bucket (`media-public`) and private signed-URL bucket (`media-private`) separated.
- [x] Supported MIME types and file size limits documented.

---

## 6. Authentication & Studio Security
- [x] Supabase Auth strategy established for Studio operations.
- [x] Public vs Studio routing boundaries separated: `/(public)` vs `/studio`.
- [x] Security policies documented: anonymous users cannot view `PRIVATE` or `UNLISTED` content.

---

## 7. Design System & Foundational UI Components
- [x] Design tokens documented (`src/styles/tokens.ts`):
  - [x] Public color system: deep cinema black (`#0B0D0E`), obsidian surface (`#121518`), warm text (`#F3F4F6`), cinematic amber (`#D97706`).
  - [x] Studio color system: clean slate operational theme.
  - [x] Typography, spacing scale, radii, motion easing curves, reduced-motion fallback.
- [x] Foundational reusable components created (`src/components/ui/`):
  - [x] `button.tsx`
  - [x] `input.tsx`
  - [x] `select.tsx`
  - [x] `card.tsx`
  - [x] `badge.tsx`
  - [x] `dialog.tsx`
  - [x] `drawer.tsx`
  - [x] `tabs.tsx`
  - [x] `modal.tsx`
  - [x] `toast.tsx`
  - [x] `empty-state.tsx`
  - [x] `error-state.tsx`
  - [x] `skeleton.tsx`
  - [x] `pagination.tsx`
  - [x] `media-preview.tsx`
  - [x] `image-frame.tsx`

---

## 8. Continuous Integration & Quality Gates
- [x] GitHub Actions workflow created (`.github/workflows/ci.yml`).
- [x] Automated test runner configured (Vitest).
- [x] Zero typecheck errors: `npm run typecheck`.
- [x] Zero linter errors: `npm run lint`.
- [x] Unit test suites pass: `npm run test`.
- [x] Production build passes: `npm run build`.
