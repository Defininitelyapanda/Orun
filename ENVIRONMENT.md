# Environment

`.env.example` documents required local variables. Generate `AUTH_SECRET` and `PLAYBACK_SIGNING_SECRET` with at least 32 random bytes. Use a secrets manager in production; never put private values in `NEXT_PUBLIC_*` variables.

Set `DEMO_MODE=true` only locally. Provider callback URLs must be HTTPS and publicly reachable. Use separate buckets or prefixes and credentials for public artwork and private media.
