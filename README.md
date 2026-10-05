# ORUN

**Cinema Beyond Boundaries.** ORUN is an API-first OTT/VOD foundation built with Next.js, TypeScript, PostgreSQL, Prisma, Redis, S3-compatible object storage, BullMQ, FFmpeg, HLS, and provider-isolated payments.

## Quick start

1. Copy `.env.example` to `.env` and replace development secrets.
2. Run `docker compose up -d postgres redis minio`.
3. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.
4. Run `npm run dev`. Run the media worker separately with `npm run worker:media`.

Useful checks: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

The UI demo catalog is isolated in `server/demo` and must never be enabled in production. Production content comes from PostgreSQL. See the root documentation files for system-specific setup and operational notes.
