# ORUN invitation-only filmmaker portal

## Architecture

This upgrade extends the existing ORUN application. It does not introduce a second identity system, database, catalogue, taxonomy, media store, analytics pipeline or administrator dashboard.

- Identity: existing `User`, `Session` and verified email records.
- Owner authorization: existing `AdminUser` roles plus a strict `OWNER` check for creator admission, review and publication.
- Catalogue: existing `Film`, genre/theme/classification tables and public playback rules.
- Media: existing `MediaAsset` and `IngestionJob` pipeline with private, signed object-storage upload tickets.
- Analytics: existing consent-aware `AnalyticsEvent` records, rolled into creator-safe film/day aggregates.
- Operations: existing email provider, notifications and append-only `AuditLog`.

## Data model

Migration `20261030083000_invitation_only_creator_portal` adds:

- `CreatorProfile` and explicit `CreatorFilmPermission` grants.
- `CreatorInvitation` with hashed, expiring, single-use tokens.
- `FilmSubmission`, immutable `FilmSubmissionVersion` records and `SubmissionReview` history.
- `FilmPublicationRecord`, tied to the exact approved version.
- `CreatorFilmAnalytics` containing only qualified views, watch seconds, starts and completions.
- `CreatorNotification` for private workflow updates.

Existing viewer accounts are linked through `User.id`; their password, subscription, profiles and viewing history are not replaced.

## Role and permission matrix

| Capability | Owner | Approved creator | Viewer |
| --- | --- | --- | --- |
| Issue/revoke invitations | Yes | No | No |
| Approve/suspend creators | Yes | No | No |
| Create private drafts | All records | Own workspace | No |
| Upload private media | All records | Own submission and quota | No |
| Review/approve versions | Yes | No | No |
| Publish/unpublish | Yes | No | No |
| Creator analytics | All films | Authorized films only | No |
| Viewer identity/history in analytics | No creator exposure | Never | Own account features only |

## Workflow

Technical processing and editorial status remain separate. A successful upload or transcode cannot publish content.

`DRAFT → UPLOADING → PROCESSING → PENDING_REVIEW → APPROVED → PUBLISHED`

Additional outcomes are `CHANGES_REQUESTED`, `REJECTED`, `PROCESSING_FAILED`, `WITHDRAWAL_REQUESTED` and `UNPUBLISHED`. Approval records an exact version. Publication performs a second owner-only check that the same current version is approved and media-ready. Critical edits create a new version and return the submission to draft review without replacing the currently published film.

## Routes

- Filmmaker UI: `/creator`, `/creator/films`, `/creator/upload`, `/creator/submissions`, `/creator/analytics`, `/creator/profile`, `/creator/notifications`, `/creator/support`.
- Invitation acceptance: `/creator/invite/[token]`.
- Owner UI: `/admin/creators`, `/admin/submissions`, `/admin/submissions/[id]`.
- Protected APIs: `/api/admin/creators/invitations`, `/api/admin/creator-submissions/*`, `/api/creator/invitations/*`, `/api/creator/submissions/*`, `/api/creator/uploads/*`, `/api/creator/analytics`.
- Internal aggregation: `/api/internal/creator-analytics/rollup`.

## Analytics definitions

- Qualified view: a distinct playback session that reaches 30 seconds or 25% of runtime, whichever is lower.
- Watch time: positive playback progress, capped per heartbeat interval so duplicate and overlapping events are not double-counted.
- Completion: a distinct started session reaching at least 90% of runtime.

Creator APIs return no viewer identifiers or raw event records.

## Deployment requirements

1. Configure `DATABASE_URL` and apply Prisma migrations with `npx prisma migrate deploy`.
2. Configure `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` for private media uploads.
3. Configure `EMAIL_API_URL`, `EMAIL_API_KEY` and `EMAIL_FROM` to send invitation and workflow mail.
4. Configure `ANALYTICS_ROLLUP_SECRET` and schedule the two internal analytics rollups.
5. Keep the private bucket non-public; public playback must use the existing publication and playback-authorization path.

## Current limitations

- Storage-provider multipart support determines whether a client can resume a very large individual upload. The API provides short-lived direct upload tickets and safe retry; multipart orchestration can be added for a specific provider without changing the review model.
- Email delivery is provider-dependent. When email is not configured, the owner UI displays the single-use acceptance link once so it can be delivered securely out of band.
- The currently deployed Worker needs a production database and private object-storage credentials before creator records and uploads become operational. Until then, owner and creator data views fail closed.
