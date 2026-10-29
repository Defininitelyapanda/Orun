# Authentication

## Current flow

ORUN uses its existing Prisma/PostgreSQL account store and server-managed sessions. A user may register and sign in with a normalized email address, E.164 phone number, or case-insensitive username. Email and phone registrations remain `PENDING` until a six-digit, ten-minute verification challenge succeeds; username registrations can become active immediately. Unique database indexes prevent duplicate identifiers and the registration service checks before insertion for a clear response.

Passwords use PBKDF2-SHA-256 with 600,000 iterations and a fresh 128-bit salt per password. This standards-based, one-way scheme is retained for Node/Web Crypto and Cloudflare compatibility. The encoded hash contains only the algorithm parameters, salt, and derived hash. Raw passwords are never stored, logged, returned, or made available to administrators. The format is algorithm-tagged so a future Argon2id migration can rehash accounts after successful login without resetting existing passwords.

Login creates a random opaque token. PostgreSQL stores only its SHA-256 hash; the browser receives the raw value in an `HttpOnly`, production-`Secure`, `SameSite=Lax` cookie. Normal login uses a browser-session cookie with a 12-hour server expiry. “Remember me” uses a persistent 30-day cookie and matching server expiry. Tokens rotate naturally on each authentication, and logout, password reset, password change, suspension, or administrator revocation can invalidate sessions server-side.

Five failed account logins trigger a temporary progressive lock. API-level rate limits and generic login/recovery responses reduce brute-force and account-enumeration risk. In-memory request throttling is suitable only as an application guard; production should use a shared Cloudflare rate-limit, Durable Object, or KV-backed counter across isolates.

## Administrator sign-in

Administrators sign in only at `/auth/admin-login` with a private numeric administrator code and password. The member login rejects accounts that have an administrator record, and the administrator route rejects ordinary member accounts. Administrator sessions are browser sessions rather than remembered sessions; existing MFA controls remain available for protected operations.

Configure or rotate the owner account as a one-time database operation by setting `ORUN_OWNER_CODE`, `ORUN_OWNER_PASSWORD`, and optionally `ORUN_OWNER_NAME`, then running `npm run admin:bootstrap`. Remove those environment values after the command completes. The runtime does not need the plaintext administrator password: PostgreSQL retains only its PBKDF2 hash.

## Password managers

Sign-up, sign-in, verification, recovery, reset, and password-change forms use stable names/IDs and standard autocomplete tokens: `username`, `current-password`, `new-password`, and `one-time-code`. Browsers and operating systems decide whether to generate, save, or autofill credentials. Attribute compatibility is automated; a real Google Password Manager prompt has not been device-certified by this repository.

## Required production configuration

- `DATABASE_URL` — PostgreSQL with all migrations applied.
- `EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM` — email verification and password reset delivery.
- `SMS_API_URL`, `SMS_API_KEY`, `SMS_FROM` — phone verification delivery.
- HTTPS — required for the production `Secure` session cookie.

Do not place provider keys or authentication secrets in `NEXT_PUBLIC_*` values. The current Cloudflare deployment must receive database and delivery bindings/secrets before account creation can work end-to-end.

## Migration

Apply `20261028120000_authentication_upgrade` before deploying code that uses multi-identifier accounts. It keeps existing users and password hashes, makes legacy email nullable, and adds username/phone uniqueness, verification challenges, lockout metadata, and remembered-session metadata. No destructive reset or password migration is required.

Passkey records remain reserved in the schema, but ordinary password login does not depend on WebAuthn. Passkeys should stay disabled until full registration/authentication ceremonies and recovery policy are tested.
