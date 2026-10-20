# ORUN Platform Upgrade 03

## Player audit

Before this upgrade ORUN had a normal full-width watch page and browser-native fullscreen through the player, but no internal compact/minimized mode or picture-in-picture workflow. Upgrade 03 adds an explicit ORUN compact mode stored as `orun_compact_player`; fullscreen remains owned by the player and is not treated as compact mode. YouTube-backed playback does not expose picture-in-picture through ORUN's current player wrapper.

## Implemented

- One-at-a-time film hover previews rendered through a document portal so horizontal rows cannot clip them.
- 400 ms open and 160 ms close delays, pointer bridge behavior, viewport clamping, Escape dismissal, focus activation, touch preview button, timer cleanup, and scroll/resize dismissal.
- Preview metadata uses catalogue values only: title, synopsis, year, runtime, classification, genres, themes, quality, access, and ratings only when both a real score and count exist.
- Preview clips are requested only after the panel opens, remain muted, and are skipped when Low Bundles Mode or autoplay preferences disable them. Approved trailer media unmounts when the preview closes.
- Hero trailer components are keyed to the active film. Slide changes reset trailer-open state and unmount the previous media; carousel progression pauses while a trailer is open or the hero is being used.
- Missing hero trailers now have an accurate disabled state rather than reusing the full film or a different slide's trailer.
- The watch page order is now player, title/metadata/actions, inline public feedback, then related films.
- Comment count, owner edit/delete, report controls, most-helpful/newest sorting, pagination, and distinct rating controls reuse Upgrade 02's public feedback service.
- Explicit compact-player mode with persistent narrow desktop media navigation, collapsible/icon-only mode, and a mobile drawer. Category destinations are derived from the current catalogue taxonomy and use URL-backed discovery filters.
- Admin title controls for hero eligibility/order/duration and per-title comments, ratings, and trailers; authorized trailer linking and taxonomy management; comment-report moderation queue.

## Data changes

Migration `20261020153000_hover_player_admin_controls` adds `commentsEnabled`, `ratingsEnabled`, `trailersEnabled`, `heroOrder`, and `heroDisplaySeconds` to `Film`, plus the hero-selection index. Apply it after Upgrade 02 through the normal production migration process and regenerate Prisma Client.

## Verification

- Prisma Client generation: passed.
- TypeScript: passed.
- ESLint: passed without warnings.
- Vitest: 7 files, 20 tests passed.
- Next.js production build: passed; 53 routes generated.
- Cloudflare/Vinext production build: passed.
- Local HTTP smoke check: watch, filtered discovery, and admin catalogue routes returned HTTP 200; rendered watch markup contains inline comments and compact-mode controls.

An interactive browser surface was unavailable in the execution environment, so pointer movement, responsive drawer visuals, and real media playback were not manually exercised through browser automation. These remain staging-browser acceptance checks rather than claimed passes.

## External requirements and limitations

- The temporary B28 catalogue contains full-film YouTube IDs but no approved trailer assets. ORUN correctly shows `Trailer unavailable` and does not misuse full films as trailers. Administrators must add approved trailer URLs before hero/hover trailer playback can be exercised.
- Database-backed comments, ratings, moderation, and admin writes require the PostgreSQL migrations and a Workers-compatible Prisma connection. The current Cloudflare deployment exposes only the asset binding.
- Distributed rate limiting still requires the planned Redis/shared limiter before horizontally scaled production use.
