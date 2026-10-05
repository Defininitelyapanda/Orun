# Architecture

ORUN separates presentation (`app`, `components`), platform code (`lib`), business workflows (`server/services`), asynchronous processing (`server/workers`), and persistence (`prisma`). Browser code never receives storage, email, payment, or signing secrets.

The request path is Next.js → authenticated route/service → Prisma/PostgreSQL. Long-running ingestion work is queued in Redis/BullMQ and handled by FFmpeg workers. Originals and renditions live in private object storage; playback uses a CDN and five-minute authorization tokens. Provider-specific commerce code implements `PaymentProvider`; ORUN services own pricing, orders, fulfillment, entitlements, and reconciliation.
