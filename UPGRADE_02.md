# ORUN Platform Upgrade 02

## Architecture audit

ORUN is a Next.js 16 App Router application using React 19, Prisma 6 with PostgreSQL, cookie-backed sessions, server route handlers, Tailwind CSS, and Vitest. The existing catalogue UI uses a small server-owned temporary B28 catalogue while production entities live in Prisma. Authentication is resolved by `currentAuthSession`; viewer identity is the first profile on the authenticated account. Media processing and entitlement services remain separate from catalogue presentation.

This upgrade keeps that architecture. Public and private feedback are deliberately stored and served through separate APIs. Public ratings retain their raw average/count while recommendation ranking uses a separate Bayesian confidence score. Discovery filters run on the server and remain encoded in the URL. The demo catalogue remains available when PostgreSQL is not configured.

## Migration and rollout

Apply `prisma/migrations/20261020120000_creator_feedback_discovery/migration.sql` with the normal production migration process, then run `npm run db:generate`. Do not run the demo seed against production. In a non-production demo environment, `npm run db:seed` creates the taxonomy, viewer and creator accounts, catalogue mappings, and official recipient mappings.

Required configuration remains `DATABASE_URL` plus the existing session/auth configuration. A production deployment should replace the process-local request limiter with the existing Redis/BullMQ infrastructure (or an edge-compatible shared limiter) before horizontally scaling write APIs.

## Implemented

- Public comments with author metadata, paging, sorting, helpful reactions, reports, creator-reply endpoint, validation, same-origin checks, authentication, and rate limits.
- Private film-to-creator conversations, official recipient mapping, strict participant authorization, read/unread state, archive state, replies, and privacy-safe notifications.
- Five-star submit/update/remove workflow, unique active rating per profile and film, raw aggregate/distribution, and confidence-aware ranking data.
- Primary genre and story-theme taxonomies, film mappings, regional/language/format/quality/access metadata, indexes, and authenticated admin APIs.
- URL-backed discovery search, combined filters, stable sorts, pagination, active-filter clearing, and empty results.
- Dynamic accessible hero carousel with manual controls, pause, touch swipe, reduced-motion handling, and selected catalogue artwork.
- Approved-trailer-only action and responsive 16:9 dialog with actual mute/play controls, Escape/backdrop close, focus return, unload-on-close, and Low Bundles behavior.
- Creator inbox UI and player shortcut to film discussion.

## Partially implemented / infrastructure-dependent

- Admin catalogue, taxonomy, and trailer management are implemented as authorized audited APIs; the existing compact admin dashboard does not yet expose full editing forms.
- Trailer URLs and metadata can be registered. Binary upload, compatibility probing, and transcoding continue to depend on ORUN's object storage/media worker and are not simulated in the browser.
- Discovery is server-rendered and paginated for the current temporary catalogue. The Prisma schema and indexes are ready, but swapping the demo catalogue read adapter for a production database query is still required for a large live catalogue.
- In-platform creator notifications are implemented. Email delivery is not sent because no creator-feedback email provider/template is configured; private message bodies are never copied into notification previews.
- Blocking is enforced by the data model and message send path. A viewer-facing block/mute management screen is not included.
- Rate limiting is enforced in-process. Multi-instance production needs a shared durable limiter.

## Verification

- `npm run db:generate` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 7 files, 18 tests passed.
- `npm run build` — passed; 52 application routes generated.

Database-backed end-to-end writes were not executed because no production/test `DATABASE_URL` was supplied in this workspace. Route authorization and business logic compile and are covered by unit-level catalogue/recommendation tests, but staging should still exercise migrations and authenticated write workflows against PostgreSQL before release.
