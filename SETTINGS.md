# ORUN settings, privacy, and security

## Implemented

- Responsive settings navigation under `/profile/settings` with account, profile, playback, language, personalization, privacy, notification, security, household, accessibility, subscription, and data-request sections.
- Browser-local preferences for guests, with authenticated synchronization through `GET/PATCH /api/settings` when PostgreSQL and sign-in are available.
- Normalized Prisma records for account/profile preferences, privacy, notifications, consent history, export/deletion requests, security events, and privacy audit events.
- Privacy-by-default optional analytics choices and versioned cookie consent. Strictly necessary storage cannot be disabled.
- Password changes with current-password verification, PBKDF2 hashing, best-effort request throttling, other-session revocation, and security-event logging.
- Authenticated session listing plus individual and all-other-session revocation. Session secrets, IP addresses, and fabricated locations are never returned.
- Request/status records for JSON data exports. Quality preferences remain capped by subscription entitlement limits.
- Accessibility preferences applied across the interface. Trailer autoplay follows the saved profile preference.

## Routes

- `GET/PATCH /api/settings`
- `GET/POST /api/settings/cookie-consent`
- `GET/DELETE /api/settings/security/sessions`
- `DELETE /api/settings/security/sessions/:id`
- `POST /api/settings/security/password`
- `GET/POST /api/settings/data-export`

All authenticated mutations derive the account from the HttpOnly session cookie, validate input, check same-origin requests, and never accept a browser-supplied user ID.

## Database deployment

Set `DATABASE_URL` to a TLS-protected PostgreSQL connection available to the runtime. Review and apply the migration:

```text
npx prisma migrate deploy
npx prisma generate
```

The current Cloudflare Worker has no database binding. Account synchronization, sign-in, session security, subscriptions, and export request persistence therefore remain unavailable in that deployment until a Worker-compatible PostgreSQL connection (for example, Hyperdrive or an HTTP-capable provider) and `DATABASE_URL` secret are configured. Guest preferences and cookie choices remain functional in the browser.

## Privacy and retention decisions

- Optional analytics, personalized measurement, diagnostics, and optional cookies default off.
- Consent history records policy version, categories, time, user when authenticated, and region when supplied.
- Security/fraud, payment reconciliation, and operational records are explicitly outside optional analytics consent and require a documented retention schedule and lawful basis.
- Export records contain status and authorized storage references, not exported content or raw download tokens.
- Deletion is deliberately unavailable in the UI until verified identity, background processing, session revocation, shared-data handling, export revocation, and lawful financial-retention workflows are connected.
- Public-profile and advertising settings are omitted because those products do not exist.

Kenyan Data Protection Act and other regional obligations require legal review; these technical controls do not by themselves constitute a compliance claim.

## Required production integrations

- Worker-compatible PostgreSQL connectivity and migration deployment.
- Durable distributed rate limiting; the in-process limiter is only defense in depth.
- Transactional email for email verification and verified email changes.
- A privacy operations worker and private object storage for exports, expiring authorized links, and deletion processing.
- Email/push providers before those notification controls can be enabled.
- Complete WebAuthn/TOTP ceremonies before passkey or MFA controls can be enabled.
- Provider-hosted billing management, invoices, and cancellation flows.
- Admin RBAC enforcement before privacy-policy and retention configuration is exposed.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build:vinext`. Test database-backed behavior against an isolated PostgreSQL database with synthetic accounts before production migration. Verify keyboard navigation at mobile and desktop breakpoints and test session revocation from two independent browsers.
