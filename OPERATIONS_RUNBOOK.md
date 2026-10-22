# ORUN operations runbook

This runbook defines the minimum production operating procedure. It does not claim that a provider-side action has happened; each action must leave a durable evidence link in the readiness control plane.

## Deploy

1. Confirm the commit is reviewed, CI is green, database migration SQL is archived, and a rollback owner is assigned.
2. Rehearse migrations against a production-like copy, including timing, locks and backward compatibility. Record `MIGRATION_REHEARSAL` evidence.
3. Verify a current backup restore into an isolated database and validate representative records. Record `BACKUP_RESTORE` evidence.
4. Deploy application code compatibly before applying destructive schema changes. Apply Prisma migrations with a dedicated deployment identity.
5. Run smoke, E2E, security and load checks; verify logs, metrics and alert delivery. Record each result with a reference to immutable output.
6. Request a launch decision. A blocked decision is expected whenever a capability or evidence item is missing.

## Roll back

1. Stop the rollout and declare an incident when users, data integrity, authentication, playback or payments are at risk.
2. Restore the previous Cloudflare Worker version. Do not reverse a database migration until its migration-specific rollback has been rehearsed.
3. Disable risky behavior through a versioned feature flag when that contains impact faster than code rollback.
4. Validate liveness, readiness and critical user journeys. Record `ROLLBACK_EXERCISE` evidence during scheduled drills.

## Restore and incident response

1. Preserve logs and correlation identifiers, open an incident, name a commander and classify severity.
2. Restore into isolation first; validate consistency before traffic cutover. Never overwrite the only recoverable copy.
3. Move incidents through investigating, mitigated and resolved states with an audit reason.
4. Rotate affected credentials in the provider, record only the alias and evidence reference, and never paste secret values into ORUN.

## Required external services

Managed PostgreSQL with PITR, Redis, private object storage, a CDN/playback signing setup, payment provider credentials, transactional email, media workers, centralized telemetry and alert routing must be configured outside this repository.
