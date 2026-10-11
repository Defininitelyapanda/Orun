# Streaming

Masters enter private object storage, then a BullMQ job validates them and FFmpeg creates HLS renditions at 360p–2160p, thumbnails, previews, and metadata. Extend the worker with DASH when required. Never expose the master key.

`POST /api/playback/authorize` evaluates region, entitlement, plan quality, rental/purchase state, and concurrent streams before issuing a short-lived token. The CDN or manifest service must verify that token and refuse renditions above its `q` claim.
