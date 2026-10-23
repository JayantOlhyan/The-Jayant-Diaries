# Contributing to The Jayant Diaries

Thank you for your interest in contributing to **The Jayant Diaries**! This project is an open-source, permanent personal digital travel archive designed to preserve memories, photographs, and field notes as cinematic journeys with total data sovereignty.

---

## 1. Principles of the Project

1. **Data Sovereignty First**: Users own their media, GPS tracks, notes, and relational schemas.
2. **Modular Monolith**: Built with the Next.js App Router. We avoid accidental distributed complexity.
3. **Zero Private Data Leakage**: Records marked `visibility = 'PRIVATE'` must never be exposed through public routes, APIs, or metadata.
4. **Cinematic Craft**: Typography, dark themes, and subtle animations must respect the contemplative travel documentary aesthetic.

---

## 2. Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm or pnpm
- A Supabase project or local PostgreSQL instance

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JayantOlhyan/The-Jayant-Diaries.git
   cd The-Jayant-Diaries
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Supabase URL, Anon Key, and Service Role Key for local exploration.

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Quality Verification Gate

Before submitting a pull request, run all verification commands locally:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Every check must pass with zero errors and unhandled warnings.

---

## 4. Pull Request Guidelines

- Branch naming: `feat/<feature-name>`, `fix/<issue-name>`, `docs/<topic>`.
- Keep changes focused and atomic.
- Include unit tests in `src/**/__tests__/` whenever introducing new logic or components.
- Do not check in personal secrets or private credentials.

Thank you for helping craft a quieter, more enduring sanctuary for travel memories.
