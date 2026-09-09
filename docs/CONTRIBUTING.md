# CONTRIBUTING GUIDELINES — THE JAYANT DIARIES

Thank you for contributing to **The Jayant Diaries**. This project serves as a permanent, long-lived personal travel archive. Every commit must reflect production quality, architectural discipline, and respect for canonical data models.

---

## 1. Branch Naming Conventions

All branch names must follow this structure:

- `feature/<description>`: New functional capabilities (e.g., `feature/batch-media-upload`)
- `fix/<description>`: Bug fixes and security patches (e.g., `fix/exif-gps-extraction`)
- `refactor/<description>`: Non-functional refactoring (e.g., `refactor/repository-caching`)
- `docs/<description>`: Documentation additions and updates (e.g., `docs/add-api-specs`)
- `chore/<description>`: Tooling, dependency updates, and maintenance (e.g., `chore/bump-deps`)

---

## 2. Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect code logic (formatting, white-space)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, tooling, or dependencies

### Good Example
```text
feat(media): implement deterministic storage path generator

Generates stable UUID-based paths for original, large, medium, small,
and thumbnail webp variants. Prevents filename conflicts on batch ingestion.
```

### Rejected Examples
- `update`
- `changes`
- `final`
- `fixed stuff`

---

## 3. Pull Request Requirements

Before opening a PR or merging into `main`:
1. **Quality Gate Execution**:
   - `npm run typecheck` passes with zero errors.
   - `npm run lint` passes with zero warnings or errors.
   - `npm run test` passes 100% of test suites.
   - `npm run build` succeeds locally.
2. **Documentation Sync**: Any changes to data models, routes, or environment variables must be reflected in `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, or `.env.example`.
3. **No Commits with Secrets**: Ensure no `.env.local` or API keys are included in the diff.

---

## 4. Dependency Policy

- Prioritize native platform and Web Standard APIs before introducing external npm dependencies.
- Any new dependency must be justifiable in terms of:
  1. Longevity and active maintenance.
  2. Minimal bundle weight.
  3. Strict adherence to TypeScript types.
- Do not introduce UI frameworks that duplicate Tailwind CSS or native React primitives.

---

## 5. Database Migration Discipline

- Schema changes must **never** be executed manually on production.
- Every change requires a new migration in `supabase/migrations/` with a descriptive timestamped filename.
- Migrations must be backwards-compatible wherever possible.
- Never write destructive migrations that drop columns without a staged deprecation window.
