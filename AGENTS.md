# AGENTS.md — Operational Contract for AI Coding Agents

## 1. Mission
Build and maintain **The Jayant Diaries** (`https://github.com/JayantOlhyan/The-Jayant-Diaries.git`) strictly in accordance with the canonical Master Product Requirements Document (`docs/PRD.md`).

The system is a permanent personal digital travel archive that transforms scattered photographs, videos, journals, places, memories, and Instagram posts into structured cinematic journeys.
- **Conceptual model**: Netflix for Jayant’s memories.
- **System behavior**: A structured, normalized personal travel database.
- **Public experience**: A premium travel documentary.

---

## 2. Immutable Operational Rules

1. **Read Before Writing**: Always read `AGENTS.md` and the relevant documentation (`docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`) before making architectural or structural changes.
2. **Order of Thinking**: Always follow this sequence:
   **Product → Architecture → Data → Workflow → UX → Implementation → Validation**
3. **Canonical Source of Truth**: The PostgreSQL database and Supabase Storage bucket are the canonical sources of truth. Instagram is merely an external distribution channel and reference. Never make Instagram the system of record.
4. **Data Ownership & Integrity**: Do not casually alter relational database schemas or relationships. Relational integrity must be preserved. Never introduce breaking changes without a documented migration.
5. **Zero Private Data Leakage**: Private archival records (`visibility = 'PRIVATE'`) must NEVER be exposed in public API responses, server-rendered public HTML, sitemaps, search indices, or public storage URLs.
6. **No Speculative Complexity**: Maintain a **modular monolith** within Next.js App Router. Do not introduce microservices, message queues, external Docker setups, or standalone backend frameworks (e.g. FastAPI/Express) unless explicitly justified and approved.
7. **No Unjustified Dependencies**: Reach for standard library / native platform capabilities before introducing new third-party packages.
8. **Focused Scopes**: Implement only the requested feature. Do not refactor unrelated files or rewrite working patterns while solving a specific task.
9. **Document Synchronously**: When architecture, database schema, or workflows evolve, immediately update the corresponding docs in `docs/`.
10. **Validation Gate Before Completion**: Never declare a task complete until all quality gate checks pass.

---

## 3. Product Loop Principle

Every architectural and implementation choice must reinforce the core product loop:

$$\text{TRAVEL} \longrightarrow \text{CAPTURE} \longrightarrow \text{UPLOAD} \longrightarrow \text{ORGANIZE} \longrightarrow \text{ARCHIVE} \longrightarrow \text{PUBLISH} \longrightarrow \text{REMEMBER}$$

- **Target UX**: Less than 15 minutes of manual organization per trip after media upload.
- **Rule of Automation**: Automation and AI should propose/suggest; AI must never silently reorganize or rewrite the canonical archive. Human approval by Jayant is final.

---

## 4. Quality Gate

Before committing or concluding any implementation, run the project's quality verification:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Every check must complete with zero errors and zero unhandled warnings.

---

## 5. Architectural Invariants

- **Routing Boundary**:
  - `/(public)/*` routes are public, SSR/ISR-friendly, read-only, dark cinematic aesthetic.
  - `/studio/*` routes are private, authenticated, operational, high-efficiency interfaces.
- **Data Access Boundary**:
  - Direct database queries must use the repository layer (`src/server/repositories/`).
  - Public data queries must enforce `visibility = 'PUBLIC'` and `status = 'PUBLISHED'` at both SQL/RLS and repository layers.
- **Storage Path Convention**:
  - Deterministic paths: `media/{mediaId}/original`, `media/{mediaId}/thumbnail`, `media/{mediaId}/small`, `media/{mediaId}/medium`, `media/{mediaId}/large`.
  - Media IDs are UUIDs independent of human file names or external URLs.
