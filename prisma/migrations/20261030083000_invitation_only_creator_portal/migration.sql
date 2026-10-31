CREATE TYPE "CreatorAccessStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'SUSPENDED', 'REVOKED');
CREATE TYPE "CreatorInvitationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'PENDING_APPROVAL', 'APPROVED', 'SUSPENDED');
CREATE TYPE "CreatorSubmissionStatus" AS ENUM ('DRAFT', 'UPLOADING', 'PROCESSING', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'CHANGES_REQUESTED', 'REJECTED', 'PROCESSING_FAILED', 'WITHDRAWAL_REQUESTED', 'UNPUBLISHED');
CREATE TYPE "CreatorProcessingStatus" AS ENUM ('NOT_STARTED', 'UPLOADING', 'VALIDATING', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE "SubmissionReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED');
CREATE TYPE "PublicationAction" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

CREATE TABLE "CreatorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "productionCompany" TEXT,
  "biography" TEXT,
  "websiteUrl" TEXT,
  "countryCode" VARCHAR(2),
  "accessStatus" "CreatorAccessStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "termsAcceptedAt" TIMESTAMP(3),
  "contentTermsAcceptedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedByAdminId" TEXT,
  "suspendedAt" TIMESTAMP(3),
  "suspensionReason" TEXT,
  "uploadQuotaBytes" BIGINT NOT NULL DEFAULT 53687091200,
  "usedUploadBytes" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreatorInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailHash" TEXT NOT NULL,
  "tokenHash" TEXT,
  "intendedName" TEXT,
  "productionCompany" TEXT,
  "status" "CreatorInvitationStatus" NOT NULL DEFAULT 'DRAFT',
  "expiresAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "acceptedUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "invitedByAdminId" TEXT NOT NULL,
  "resendCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreatorFilmPermission" (
  "id" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "filmId" TEXT NOT NULL,
  "permissions" TEXT[] DEFAULT ARRAY['READ', 'EDIT_METADATA', 'SUBMIT', 'VIEW_ANALYTICS']::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "grantedByAdminId" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "CreatorFilmPermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorFilmPermission_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CreatorFilmPermission_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FilmSubmission" (
  "id" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "filmId" TEXT,
  "title" TEXT NOT NULL,
  "status" "CreatorSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "processingStatus" "CreatorProcessingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
  "submittedAt" TIMESTAMP(3),
  "lastFeedbackAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FilmSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FilmSubmission_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FilmSubmission_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "FilmSubmissionVersion" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "metadata" JSONB NOT NULL,
  "rightsDeclaration" JSONB NOT NULL,
  "accessibility" JSONB,
  "supportingDocuments" JSONB,
  "processingStatus" "CreatorProcessingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "createdByUserId" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "approvedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FilmSubmissionVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FilmSubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FilmSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SubmissionReview" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "decision" "SubmissionReviewDecision" NOT NULL,
  "feedback" TEXT,
  "requiredChanges" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "reviewedByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FilmSubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FilmPublicationRecord" (
  "id" TEXT NOT NULL,
  "filmId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "action" "PublicationAction" NOT NULL,
  "reason" TEXT,
  "performedByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FilmPublicationRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FilmPublicationRecord_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FilmPublicationRecord_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FilmSubmissionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CreatorFilmAnalytics" (
  "id" TEXT NOT NULL,
  "filmId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "qualifiedViews" INTEGER NOT NULL DEFAULT 0,
  "watchSeconds" BIGINT NOT NULL DEFAULT 0,
  "startedViews" INTEGER NOT NULL DEFAULT 0,
  "completedViews" INTEGER NOT NULL DEFAULT 0,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorFilmAnalytics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorFilmAnalytics_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CreatorNotification" (
  "id" TEXT NOT NULL,
  "creatorProfileId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "actionUrl" TEXT,
  "emailSentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorNotification_creatorProfileId_fkey" FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "MediaAsset" ADD COLUMN "submissionVersionId" TEXT;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "FilmSubmissionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE INDEX "CreatorProfile_accessStatus_createdAt_idx" ON "CreatorProfile"("accessStatus", "createdAt");
CREATE UNIQUE INDEX "CreatorInvitation_tokenHash_key" ON "CreatorInvitation"("tokenHash");
CREATE INDEX "CreatorInvitation_emailHash_status_idx" ON "CreatorInvitation"("emailHash", "status");
CREATE INDEX "CreatorInvitation_status_expiresAt_idx" ON "CreatorInvitation"("status", "expiresAt");
CREATE UNIQUE INDEX "CreatorFilmPermission_creatorProfileId_filmId_key" ON "CreatorFilmPermission"("creatorProfileId", "filmId");
CREATE INDEX "CreatorFilmPermission_filmId_active_idx" ON "CreatorFilmPermission"("filmId", "active");
CREATE INDEX "FilmSubmission_creatorProfileId_status_updatedAt_idx" ON "FilmSubmission"("creatorProfileId", "status", "updatedAt");
CREATE INDEX "FilmSubmission_status_processingStatus_submittedAt_idx" ON "FilmSubmission"("status", "processingStatus", "submittedAt");
CREATE UNIQUE INDEX "FilmSubmissionVersion_submissionId_version_key" ON "FilmSubmissionVersion"("submissionId", "version");
CREATE INDEX "FilmSubmissionVersion_processingStatus_submittedAt_idx" ON "FilmSubmissionVersion"("processingStatus", "submittedAt");
CREATE INDEX "SubmissionReview_versionId_createdAt_idx" ON "SubmissionReview"("versionId", "createdAt");
CREATE INDEX "FilmPublicationRecord_filmId_createdAt_idx" ON "FilmPublicationRecord"("filmId", "createdAt");
CREATE INDEX "FilmPublicationRecord_versionId_action_idx" ON "FilmPublicationRecord"("versionId", "action");
CREATE UNIQUE INDEX "CreatorFilmAnalytics_filmId_day_key" ON "CreatorFilmAnalytics"("filmId", "day");
CREATE INDEX "CreatorFilmAnalytics_day_filmId_idx" ON "CreatorFilmAnalytics"("day", "filmId");
CREATE INDEX "CreatorNotification_creatorProfileId_readAt_createdAt_idx" ON "CreatorNotification"("creatorProfileId", "readAt", "createdAt");
CREATE INDEX "MediaAsset_submissionVersionId_idx" ON "MediaAsset"("submissionVersionId");
