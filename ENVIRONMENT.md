# Environment

`.env.example` documents required local variables. Generate `AUTH_SECRET` and `PLAYBACK_SIGNING_SECRET` with at least 32 random bytes. Use a secrets manager in production; never put private values in `NEXT_PUBLIC_*` variables.

`GET /api/health` is a liveness check. `GET /api/health/readiness` validates required production configuration and database connectivity without returning secrets or provider details. A ready response does not prove that queues, object storage, payment providers or email are healthy.

Set `DEMO_MODE=true` only locally. Provider callback URLs must be HTTPS and publicly reachable. Use separate buckets or prefixes and credentials for public artwork and private media.

To grant the first owner role, first create and verify the user, then run `ORUN_OWNER_EMAIL=owner@example.com npm run admin:bootstrap` from a trusted release environment. Do not leave `ORUN_OWNER_EMAIL` configured at runtime.
