# ORUN viewer experience upgrade

## Repository audit

- **Application:** Next.js 16 App Router with React 19, TypeScript, Tailwind CSS 4, Vinext, and Cloudflare Workers deployment.
- **Identity:** cookie sessions and Prisma-backed users/profiles. The deployed Worker currently has only the static-assets binding, so database-backed authentication and profile synchronization are not active in production.
- **Persistence:** PostgreSQL through Prisma. Existing models already cover profiles, playback preferences, media assets, renditions, audio/subtitle tracks, watch history, continue watching, sessions, entitlements, analytics, and administration.
- **Media architecture:** the production design is private object storage, HLS renditions, short-lived playback authorization, and an FFmpeg worker. The current public catalogue is a temporary six-film B28 Entertainment YouTube catalogue; the deployed films do not have ORUN-owned HLS manifests or downloadable renditions.
- **Player:** temporary catalogue playback uses the YouTube IFrame API. `OrunPlayer` remains the native-media foundation but no native source is currently attached to the public catalogue.
- **Discovery:** catalogue records are static, real B28 metadata. There is no connected viewing-event store from which to calculate legitimate Kenya or worldwide trending charts.

## Implemented in this upgrade

- YouTube IFrame API integration with real playback-speed changes, keyboard shortcuts, fullscreen, native seeking/volume/caption controls, and playback-state observation.
- Local, throttled playback progress with a 90% completion rule, resume/start-over prompt, page-exit saving, thumbnail eye/progress indicators, and a Continue Watching row. Local history is explicitly device-only.
- Brightness, contrast, and independent screen-dimming controls. These alter presentation only, never the source media.
- Low Bundles Mode persists locally, suppresses autoplay previews, and requests the external host's low adaptive rendition. The UI discloses that YouTube ultimately controls rendition selection and transfer measurement.
- A deterministic recommendation engine using real catalogue genres, moods, country, and synopsis terms. It excludes the current/unavailable title and powers detail-page and end-of-film recommendations.
- Native Web Share with clipboard fallback. No 15-second clip is generated because no approved promotional clip assets or generation rights are configured.
- An editorial Kenya chart with explicit labeling. The interface does not fabricate Top 10 or worldwide engagement data.
- Honest offline-viewing status for temporary externally hosted titles.

## Production integrations still required

1. Connect the Worker to PostgreSQL (or a Cloudflare-compatible data service) and authenticate profile-scoped APIs before enabling cross-device progress, viewing history, recommendations, or rankings.
2. Connect private object storage/CDN and publish actual HLS manifests with entitlement-aware rendition filtering. Only then can ORUN provide reliable quality selection, audio-track switching, transfer-byte telemetry, or buffering policy control.
3. Add episode relationships and episode-specific history/markers before enabling skip-intro, skip-credits, and next-episode flows. The current public catalogue contains films only.
4. Add licensed offline packages, integrity metadata, storage checks, and DRM/offline licenses. Externally embedded YouTube media must not be cached as an ORUN download.
5. Upload rights-approved promotional clips (maximum 15 seconds) or connect an authorized server-side FFmpeg workflow before exposing file sharing to WhatsApp.
6. Collect qualified, rate-limited, deduplicated viewing events and run scheduled aggregation before labeling any list “Trending on ORUN” or “Top 10.”

No additional environment variables or database migrations are introduced by the browser-capable portion of this upgrade.
