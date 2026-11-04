# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability or private data exposure risk within **The Jayant Diaries**, please report it responsibly:

1. **Do not open a public GitHub issue.**
2. Send detailed disclosure information to security maintainers via private channels or repository security advisories.
3. Include reproduction steps, affected routes/API endpoints, and potential privacy impact.

### Security Principles of The Archive

- **Zero Private Data Leakage**: Archival assets marked `PRIVATE` must never be served publicly or cached on public CDN endpoints.
- **Service Role Isolation**: Administrative keys (`SUPABASE_SERVICE_ROLE_KEY`) must never be leaked to client bundles.
- **Row Level Security (RLS)**: Enforced at the PostgreSQL level for all authenticated and anonymous access.

Thank you for helping keep our personal travel archives secure.
