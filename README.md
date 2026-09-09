# The Jayant Diaries

> **A cinematic personal travel archive transforming scattered photographs, videos, journals, places, memories, and Instagram posts into structured journeys.**

[![CI](https://github.com/JayantOlhyan/The-Jayant-Diaries/actions/workflows/ci.yml/badge.svg)](https://github.com/JayantOlhyan/The-Jayant-Diaries/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Product Vision

The conceptual model is:
> **Netflix for Jayant’s memories**

while the system behaves like:
> **A structured, normalized personal travel database**

and the public frontend presents:
> **A premium travel documentary.**

### Core Distinction
> **Instagram shows the moments. The Jayant Diaries stores the journey.**

Instagram is an external distribution channel. The PostgreSQL database and object storage represent the canonical archive. The system is engineered to remain functional, beautiful, and self-contained for decades.

---

## 2. Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom cinematic design tokens)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Protected Studio routes)
- **Storage**: Supabase Storage (Deterministic media paths & derivatives)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) & React Testing Library
- **Deployment**: [Vercel](https://vercel.com/)

---

## 3. Quick Start

### Prerequisites
- Node.js `20.x` or later (tested on Node `25.x`)
- npm `10.x` or later

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/JayantOlhyan/The-Jayant-Diaries.git
cd The-Jayant-Diaries

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public experience and [http://localhost:3000/studio](http://localhost:3000/studio) for the Studio interface.

---

## 4. Quality Gate & Scripts

```bash
# Typecheck
npm run typecheck

# Lint
npm run lint

# Run unit & integration tests
npm run test

# Production build verification
npm run build
```

---

## 5. Repository Structure

```text
The-Jayant-Diaries/
├── AGENTS.md                 # Operating contract for AI coding assistants
├── README.md                 # Project introduction and quick start
├── docs/                     # Canonical engineering documentation
│   ├── PRD.md                # Master Product Requirements Document
│   ├── ARCHITECTURE.md       # Architecture blueprint and design decisions
│   ├── DATA_MODEL.md         # Database schema, ER diagram, relationships
│   ├── SECURITY.md           # Threat model, RLS, auth, and data privacy
│   ├── DEVELOPMENT.md        # Local development workflows and commands
│   ├── DEPLOYMENT.md         # Vercel & Supabase production deployment
│   ├── CONTRIBUTING.md       # Branching, commits, and PR standards
│   └── STAGE-0-CHECKLIST.md  # Acceptance verification checklist
├── supabase/
│   └── migrations/           # Versioned PostgreSQL migration files
├── src/
│   ├── app/                  # Next.js App Router (Public, Studio, API)
│   ├── components/           # UI components (ui, public, studio, media)
│   ├── features/             # Feature domain modules
│   ├── lib/                  # Shared utilities (auth, db, storage, maps)
│   ├── server/               # Repositories and server-side services
│   ├── types/                # Database and domain TypeScript types
│   └── styles/               # Design tokens and global CSS
```

---

## 6. Engineering Documentation

For deep technical details, refer to the documentation in `docs/`:

- 📜 [Master PRD](docs/PRD.md)
- 🏗️ [Architecture Blueprint](docs/ARCHITECTURE.md)
- 🗄️ [Data Model & ER Diagram](docs/DATA_MODEL.md)
- 🔒 [Security & Privacy](docs/SECURITY.md)
- 💻 [Development Guide](docs/DEVELOPMENT.md)
- 🚀 [Deployment Runbook](docs/DEPLOYMENT.md)
- 🤝 [Contributing Guidelines](docs/CONTRIBUTING.md)
- ✅ [Stage 0 Checklist](docs/STAGE-0-CHECKLIST.md)
