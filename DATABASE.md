# Database

`prisma/schema.prisma` contains normalized identity, catalog, media, community, commerce, CMS, analytics, and administration records. Money uses `BigInt` minor units plus ISO currency. Provider events are unique by provider and event ID. Ratings and profile watch records use compound uniqueness.

Create migrations with `npm run db:migrate`. Review generated SQL before production. Back up PostgreSQL with encrypted, point-in-time-capable storage and test restoration regularly.
