CREATE TYPE "CmsReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED');

ALTER TABLE "Page"
  ADD COLUMN "reviewStatus" "CmsReviewStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "PageRevision" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "sections" JSONB NOT NULL,
  "changeNote" TEXT,
  "createdByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PageRevision_pageId_version_key" ON "PageRevision"("pageId", "version");
CREATE INDEX "PageRevision_pageId_createdAt_idx" ON "PageRevision"("pageId", "createdAt");

INSERT INTO "PageRevision" ("id", "pageId", "version", "title", "sections", "changeNote", "createdByAdminId", "createdAt")
SELECT CONCAT('migration-', "id"), "id", 1, "title", "sections", 'Baseline captured during CMS workflow migration', 'SYSTEM', CURRENT_TIMESTAMP FROM "Page";

CREATE TABLE "PagePreviewToken" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PagePreviewToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PagePreviewToken_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PagePreviewToken_tokenHash_key" ON "PagePreviewToken"("tokenHash");
CREATE INDEX "PagePreviewToken_pageId_expiresAt_idx" ON "PagePreviewToken"("pageId", "expiresAt");

CREATE TABLE "RedirectRule" (
  "id" TEXT NOT NULL,
  "sourcePath" TEXT NOT NULL,
  "destinationPath" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL DEFAULT 308,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RedirectRule_statusCode_check" CHECK ("statusCode" IN (301, 302, 307, 308)),
  CONSTRAINT "RedirectRule_distinct_paths_check" CHECK ("sourcePath" <> "destinationPath")
);
CREATE UNIQUE INDEX "RedirectRule_sourcePath_key" ON "RedirectRule"("sourcePath");
CREATE INDEX "RedirectRule_active_sourcePath_idx" ON "RedirectRule"("active", "sourcePath");

-- Manual rollback: DROP TABLE "RedirectRule", "PagePreviewToken", "PageRevision"; ALTER TABLE "Page" DROP COLUMN "reviewStatus", DROP COLUMN "currentVersion"; DROP TYPE "CmsReviewStatus";
