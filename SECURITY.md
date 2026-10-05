# Security

Production requires HTTPS, secure headers/CSP, CSRF protection on cookie-authenticated mutations, request and credential rate limits, Zod validation, malware-scanned uploads, webhook verification, RBAC, admin 2FA, immutable financial audit events, and secret rotation.

Keep premium storage private. Hash operational IP signals with rotating salt and retention limits. Treat household heuristics as signals, never identity. Run dependency, SAST, container, and infrastructure scans in CI.
