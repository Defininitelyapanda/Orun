# ORUN backend and control-centre audit

Audit date: 2026-10-20. This document records observed repository state and the staged implementation plan. It is not a production-readiness certificate.

## Current architecture

- Next.js App Router application and route handlers, React and TypeScript.
- PostgreSQL persistence through Prisma.
- Opaque database-backed user sessions and PBKDF2 password hashing.
- Provider abstractions for M-Pesa and card payments.
- S3-compatible private object storage, Redis/BullMQ and an FFmpeg media worker.
- Cloudflare Workers packaging through Vinext. The current Worker configuration does not itself provision PostgreSQL, Redis, private object storage, payment credentials, or media workers.

## Capability classification

| Area | State | Evidence or limitation |
| --- | --- | --- |
| User accounts and profiles | Functional foundation | Persistent sessions, profiles, password reset and preferences exist. Admin user detail, session revocation and owner-only suspension/reactivation are MFA-, recent-auth- and audit-gated. Distributed throttling and end-user MFA/passkey journeys remain incomplete. |
| Catalogue and taxonomy | Functional foundation | Persistent films, series, genres, themes, tones and classifications exist. Some user-facing surfaces still consume the demo catalogue. |
| Admin access | Functional foundation | `/admin` is server-protected, roles map to central permissions, operational screens re-check permissions, and session-scoped TOTP MFA/recovery-code flows are implemented. Provider-backed enforcement still requires production secrets and migrations. |
| Admin dashboard | Functional foundation | Reads live database counts and audit activity; fails closed to an unavailable state and shows no invented values. Nested operational inventories and permission-scoped global search are implemented. |
| Playback authorization | Functional foundation | Uses the authenticated session, profile ownership, entitlement state, media readiness, stream count and device ownership. Rights windows and geographic availability require dedicated data models. |
| Payments | Functional foundation | Provider verification and idempotent webhook processing are joined by provider reconciliation, dispute records, capped idempotent refund requests, independent approval and provider-backed execution. Payout operations, automated settlement imports and production-provider certification remain. |
| Media pipeline | Partial | Queue and worker foundations exist. Production worker topology, malware scanning, DRM, observability and recovery drills remain. |
| CMS | Functional foundation | Pages now have immutable revisions, draft/review/approval transitions, hashed expiring preview tokens, MFA-gated publish/schedule operations, a secret-authenticated due-publication worker endpoint and redirect records. Provider cron configuration, redirect request integration and a richer visual page builder remain. |
| Audit | Foundation implemented | Structured fields and append-only database trigger are added. Existing mutation routes still need systematic instrumentation. |
| Backups and disaster recovery | Missing operational proof | The application cannot validate provider backups, PITR, restore drills, RPO or RTO from source code alone. |

## Security findings and actions

1. Critical: playback trusted `x-orun-user-id` and hard-coded a premium entitlement. Replaced with session and database authorization.
2. High: the admin page had no server-side access gate. Added a protected layout.
3. High: admin dashboard values and activity were fabricated. Replaced with live queries and explicit unavailable states.
4. Medium: login, registration and password reset had no request throttling. Added same-origin enforcement and bounded in-process throttles. Production still requires a distributed Redis/edge limiter.
5. Medium: security response headers were absent. Added baseline CSP, frame, MIME, referrer and permissions policies.
6. Medium: audit records could be updated or deleted. Added an append-only PostgreSQL trigger and structured request/outcome metadata.
7. Medium: configuration could fail late and readiness always reported success. Added environment inspection and a coarse readiness endpoint.

## Role matrix

- `OWNER` and legacy `SUPER_ADMIN`: all permissions; assignment requires the explicit owner bootstrap command.
- `TECHNICAL_ADMIN`: system, security, settings, media and audit operations.
- `CONTENT_ADMIN`: catalogue, media, CMS and taxonomy management.
- `EDITOR`: catalogue and CMS editing.
- `MODERATOR`: moderation and catalogue read access.
- `FINANCE`: finance, payment, subscription and audit operations.
- `ANALYST`: analytics with catalogue and finance read access.
- `SUPPORT` and `CUSTOMER_SUPPORT`: user, subscription and payment read access plus support actions.

Sensitive actions must additionally require MFA and recent authentication. The server helper supports both requirements, but screens and enrolment flows are a later stage.

## Staged delivery plan

1. Foundation and critical security: configuration validation, admin gate, permissions, audit immutability, auth throttling, real playback authorization, live dashboard.
2. Control-centre routing and design system: nested routes, permission-aware navigation, global search, tables, filters and safe bulk actions.
3. Identity and user operations: admin MFA/enrolment, recent-auth challenges, session/device revocation and privacy workflows. **Foundation delivered.**
4. Catalogue, taxonomy and CMS: revisioning, previews, approvals, scheduling and redirects; remove demo catalogue consumers. **CMS workflow foundation delivered; catalogue migration and runtime redirect integration remain.**
5. Commerce: payment operations, reconciliation, disputes, refunds with dual controls, subscriptions, offers and entitlements. **Payment/refund/dispute and subscription operations foundation delivered; offer lifecycle, automated settlement imports and payout controls remain.**
6. Media operations: resilient resumable ingestion, scanning, rendition management, DRM/key integration, queue/dead-letter controls and recovery.
7. Analytics, security and operations: consent-aware aggregation, alerts, feature flags, secrets rotation and incident tooling.
8. Validation and launch: integration/E2E/security/load tests, observability, backup restore drill, migration rehearsal and rollback exercise.

## External requirements and blockers

- Managed PostgreSQL compatible with the chosen Cloudflare runtime, with PITR and tested restores.
- Managed Redis or edge rate-limiting service.
- Private S3-compatible object storage, CDN token validation and preferably a DRM/key provider.
- Independently deployed media workers with FFmpeg and queue access.
- Production M-Pesa/card merchant accounts and webhook secrets.
- Transactional email provider, centralized logging/metrics/tracing and alert routing.
- Legal decisions for retention, regional rights, age classification and privacy request SLAs.

No production claim should be made until provider integrations, migrations, E2E/security/load tests, backup restores and rollback procedures have passed in a production-like environment.
