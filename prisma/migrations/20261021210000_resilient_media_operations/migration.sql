CREATE TYPE "MediaScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');
CREATE TYPE "IngestionJobStatus" AS ENUM ('QUEUED', 'LEASED', 'SCANNING', 'TRANSCODING', 'PACKAGING', 'READY', 'RETRY_WAIT', 'DEAD_LETTER', 'CANCELLED');

ALTER TABLE "MediaAsset" ADD COLUMN "scanStatus" "MediaScanStatus" NOT NULL DEFAULT 'PENDING', ADD COLUMN "quarantinedAt" TIMESTAMP(3);
ALTER TABLE "IngestionJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "IngestionJob" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
UPDATE "IngestionJob" SET "status" = CASE "status" WHEN 'READY' THEN 'READY' WHEN 'FAILED' THEN 'DEAD_LETTER' WHEN 'PROCESSING' THEN 'RETRY_WAIT' ELSE 'QUEUED' END;
ALTER TABLE "IngestionJob" ALTER COLUMN "status" TYPE "IngestionJobStatus" USING "status"::"IngestionJobStatus", ALTER COLUMN "status" SET DEFAULT 'QUEUED';
ALTER TABLE "IngestionJob"
  ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'QUEUED', ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 5, ADD COLUMN "queueJobId" TEXT,
  ADD COLUMN "leaseOwner" TEXT, ADD COLUMN "leaseExpiresAt" TIMESTAMP(3), ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3), ADD COLUMN "deadLetteredAt" TIMESTAMP(3), ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "inputChecksum" TEXT, ADD COLUMN "outputManifest" JSONB;
CREATE UNIQUE INDEX "IngestionJob_queueJobId_key" ON "IngestionJob"("queueJobId");
CREATE INDEX "IngestionJob_status_nextAttemptAt_priority_idx" ON "IngestionJob"("status", "nextAttemptAt", "priority");
CREATE INDEX "IngestionJob_mediaAssetId_createdAt_idx" ON "IngestionJob"("mediaAssetId", "createdAt");

CREATE TABLE "IngestionAttempt" (
  "id" TEXT NOT NULL, "ingestionJobId" TEXT NOT NULL, "attempt" INTEGER NOT NULL, "workerId" TEXT NOT NULL,
  "stage" TEXT NOT NULL, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3), "outcome" TEXT, "error" TEXT, "metadata" JSONB,
  CONSTRAINT "IngestionAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IngestionAttempt_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "IngestionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "IngestionAttempt_ingestionJobId_attempt_key" ON "IngestionAttempt"("ingestionJobId", "attempt");
CREATE INDEX "IngestionAttempt_workerId_finishedAt_idx" ON "IngestionAttempt"("workerId", "finishedAt");

-- Manual rollback requires dropping IngestionAttempt, removing added columns/indexes and mapping IngestionJob status back to MediaStatus before dropping the enums.
