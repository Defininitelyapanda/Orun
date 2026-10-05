# Troubleshooting

- Prisma cannot connect: start PostgreSQL and compare `DATABASE_URL` with Compose.
- Media jobs stay queued: verify Redis, the worker process, FFmpeg, and object-storage credentials.
- Playback is denied: inspect entitlement reason, active stream count, region, and token secret.
- M-Pesa remains processing: verify callback reachability and provider status-query credentials.
- Images or manifests fail: check private bucket policy, CDN origin authorization, and CORS.
