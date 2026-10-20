# ORUN Upgrade 04 — Classification System

## Architecture

Upgrade 04 extends the existing `Genre`, `FilmGenre`, `StoryTheme`, catalogue discovery, recommendation, and admin catalogue foundations. It does not replace playback, commerce, feedback, watch history, or existing title records.

The canonical fallback taxonomy lives in `lib/taxonomy/catalog.ts`. When a database is configured, Browse reads active public roots and children from the database so administrators can add or archive classifications without a code deployment.

## Taxonomy

- 22 broad genre groups and more than 300 de-duplicated canonical genre/subgenre slugs.
- Separate content formats, story themes, tones, countries, languages, accessibility flags, and territorial audience classifications.
- Search synonyms for common terms such as sci-fi, romcom, indie, arthouse, and queer cinema.
- Short-form and digital storytelling labels are stored as formats rather than indiscriminately mixed into genres.

## Migration

`20261020170000_comprehensive_taxonomy` adds hierarchy, descriptions, localized labels, synonyms, visibility, featured ordering, archive/merge history, primary genre assignments, tones, normalized formats, country/language joins, accessibility and production metadata, audience classification systems, and creator suggestions.

Existing `FilmGenre` rows are retained. One deterministic existing assignment is promoted to primary before a partial unique index enforces one primary genre per title. The legacy scalar `Film.contentFormat` is retained for compatibility and migrated into normalized format rows. Legacy format-like genres are archived by the seed rather than silently deleted.

## Operations

- Admin taxonomy manager: create, rename, organize, feature, hide, archive, merge, search, import, export, view usage counts, audit inconsistent titles, and moderate creator suggestions.
- Archive and merge actions return the affected-title count and require explicit confirmation.
- Creator classification submissions remain pending until an authorized catalogue administrator approves them.
- Title editing supports primary and secondary genres, themes, tones, formats, origins, languages, accessibility, and expanded production metadata without re-uploading media.

## Discovery and recommendations

- Browse presents broad groups first and expandable searchable subgenres.
- Filters support AND/OR genre logic, themes, tone, format, region, country, language, year, runtime, age classification, quality, access, and data-backed sorting.
- Dedicated genre pages expose descriptions, subgenres, featured, trending, recent, sorting, and pagination states.
- Recommendation scoring now considers language and regional preferences, completion/abandonment signals, confidence-aware ratings, and a controlled discovery slot outside usual genres.

## Production prerequisite

Run the Prisma migration and seed against the production PostgreSQL database before enabling database-backed taxonomy management. Cloudflare Workers also requires a Workers-compatible database connection or HTTP database adapter; static catalogue fallbacks remain available without it.
