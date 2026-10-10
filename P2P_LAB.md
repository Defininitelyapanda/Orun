# ORUN P2P Lab

ORUN P2P Lab is an isolated research prototype for authorized peer-assisted delivery. It does not replace standard ORUN HLS playback, discover public torrents, bypass access controls, or run a torrent client on the server.

## What works

- Production-safe feature flags default to off.
- Administrators with `SUPER_ADMIN`, `CONTENT_ADMIN`, or `p2p.manage` can register authorized source metadata, verify it, disable it, and configure the experiment.
- Source metadata is schema checked, size bounded, HTTPS-only, protected from obvious private-network and cloud-metadata URLs, and optionally restricted to a hostname allowlist.
- Session creation requires a valid ORUN session, a profile belonging to that user, explicit P2P consent, an authorized source, and the existing ORUN entitlement decision.
- The lab UI exposes real state, cancellation, native accessible video controls, honest availability data, diagnostics, and an explicit standard-player fallback.
- Diagnostics and aggregate metrics are isolated from payments and ordinary entitlements. CSV export contains no full IP address.
- Peer uploading is disabled and cannot be enabled by the current API or UI.

## Prototype limitation

No browser P2P engine is bundled. Browsers do not natively play magnet links, info hashes, or `.torrent` metadata. The included adapter therefore reports `UNSUPPORTED` unless an approved `AuthorizedBrowserP2PEngine` is deliberately injected. This avoids pretending that metadata is a playable media URL and avoids turning viewers into seeders.

A future engine must support HTTPS pages, WebRTC data channels, an explicitly approved WSS tracker allowlist, compatible MP4/WebM codecs, byte-range streaming, cancellation, accurate peer/progress telemetry, and upload disabled at the protocol layer. Safari/iOS restrictions, enterprise WebRTC blocking, NAT/firewall behavior, tracker availability, and codec support must be tested rather than inferred.

## Environment

All values default to `false` in production:

```env
ORUN_P2P_ENABLED=false
ORUN_P2P_ADMIN_ENABLED=false
ORUN_P2P_BROWSER_ENABLED=false
ORUN_P2P_DIAGNOSTICS_ENABLED=false
ORUN_P2P_ALLOWED_SOURCE_HOSTS=media.example.com
```

In local `NODE_ENV=development`, omitted flags default on so engineers can reach the lab. Set any flag explicitly to `false` to disable it. Production requires both its environment flag and the database configuration toggle.

## Database and setup

1. Configure PostgreSQL through `DATABASE_URL`.
2. Apply `prisma/migrations/20261010130000_add_p2p_lab/migration.sql` using the normal release migration job.
3. Run `npm run db:generate`.
4. Create or assign an admin role with `p2p.manage` (or use `SUPER_ADMIN`/`CONTENT_ADMIN`).
5. Set `ORUN_P2P_ADMIN_ENABLED=true`, restart, and open `/admin/p2p`.
6. Register an existing ORUN film ID and authorization evidence. New sources are drafts and unverified.
7. Independently confirm distribution rights and metadata before selecting **Verify & enable**.
8. Enable the environment and database user-facing/browser/diagnostic toggles.
9. Sign in, open `/lab/p2p/<database-film-id>`, select a profile, review the disclosure, and opt in.

Use only a small video created by the ORUN team or distributed under an explicit license for manual testing. Do not use a commercial film fixture.

## Security and operations

The server never fetches submitted source URLs. If deeper validation is later added, resolve DNS immediately before every request, reject all private/link-local/metadata addresses after resolution and redirect, limit redirects and response bytes, require an approved content type, and perform validation in an isolated egress service.

Run `deleteExpiredP2PDiagnostics` from a daily maintenance job. Retention defaults to 30 days. Estimated bandwidth avoided must use measured `bytesFromPeers`; a peer count or torrent presence is not proof of saved origin traffic.

The broader ORUN repository still needs production database connectivity suitable for Cloudflare Workers (for example Prisma Accelerate or a supported driver adapter), complete standard-player entitlement lookup, durable distributed rate limiting, and end-to-end browser tests. The lab does not duplicate or bypass those platform responsibilities.
