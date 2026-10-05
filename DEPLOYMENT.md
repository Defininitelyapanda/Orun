# Deployment

Deploy the web/API service separately from scalable media workers. Use managed PostgreSQL with PITR, managed Redis, private S3-compatible storage, a token-validating CDN, transactional email, provider webhooks, and centralized logs/metrics/traces.

Run migrations as a release job before switching traffic. Health-check `/api/health`. Use rolling releases, queue retry/dead-letter policies, object versioning, multi-zone data services, and tested rollback/runbooks.
