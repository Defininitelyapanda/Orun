# Deployment

Deploy the web/API service separately from scalable media workers. Use managed PostgreSQL with PITR, managed Redis, private S3-compatible storage, a token-validating CDN, transactional email, provider webhooks, and centralized logs/metrics/traces.

Run migrations as a release job before switching traffic. Use `/api/health` for liveness and `/api/health/readiness` for readiness. Use rolling releases, queue retry/dead-letter policies, object versioning, multi-zone data services, and tested rollback/runbooks.

## Cloudflare Workers

The web application is configured for Cloudflare Workers through Vinext. In a Cloudflare Workers Builds project, use:

- Build command: `npm run build:vinext`
- Deploy command: `npm run deploy`
- Production branch: `main`

Do not configure this repository as a Cloudflare Pages static export: it contains route handlers and dynamically rendered routes that require Workers.

Add the values from `.env.example` under **Build variables and secrets**. At minimum, replace all placeholder secrets and configure `NEXT_PUBLIC_APP_URL` with the production URL. The Prisma client also needs a Workers-compatible connection such as Prisma Accelerate or a Cloudflare-compatible driver adapter before database-backed authentication routes can work in production.

For local Worker verification, run `npm run build:vinext` followed by `npm run start:vinext`. Deploy from an authenticated machine with `npm run deploy`.
