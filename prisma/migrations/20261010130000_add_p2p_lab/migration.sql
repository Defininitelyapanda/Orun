CREATE TYPE "P2PSourceType" AS ENUM ('WEBTORRENT', 'TORRENT_METADATA');
CREATE TYPE "P2PSourceStatus" AS ENUM ('DRAFT', 'CHECKING', 'AVAILABLE', 'DEGRADED', 'UNAVAILABLE', 'UNSUPPORTED', 'DISABLED');
CREATE TYPE "P2PDeliveryMethod" AS ENUM ('AUTHORIZED_P2P', 'EXPERIMENTAL_SOURCE');
CREATE TYPE "P2PPlaybackStatus" AS ENUM ('IDLE', 'CHECKING', 'READY', 'BUFFERING', 'PLAYING', 'COMPLETED', 'FAILED', 'CANCELLED', 'FALLBACK');
CREATE TYPE "P2PFailureCategory" AS ENUM ('NO_PEERS', 'SOURCE_UNAVAILABLE', 'UNSUPPORTED_CODEC', 'UNSUPPORTED_BROWSER', 'NETWORK_RESTRICTED', 'SOURCE_INVALID', 'PLAYBACK_FAILED', 'USER_CANCELLED', 'STARTUP_TIMEOUT');

CREATE TABLE "P2PSource" (
  "id" TEXT NOT NULL, "filmId" TEXT NOT NULL, "titleSnapshot" TEXT NOT NULL, "slugSnapshot" TEXT NOT NULL,
  "ownershipStatus" TEXT NOT NULL, "authorizationReference" TEXT NOT NULL, "authorizationVerified" BOOLEAN NOT NULL DEFAULT false,
  "deliveryMethod" "P2PDeliveryMethod" NOT NULL DEFAULT 'AUTHORIZED_P2P', "sourceType" "P2PSourceType" NOT NULL,
  "manifestUrl" TEXT, "infoHash" TEXT, "fileIndex" INTEGER, "fileName" TEXT, "expectedSizeBytes" BIGINT,
  "durationSeconds" INTEGER NOT NULL, "container" TEXT, "videoCodec" TEXT, "audioCodec" TEXT, "languages" TEXT[] NOT NULL,
  "subtitles" JSONB, "status" "P2PSourceStatus" NOT NULL DEFAULT 'DRAFT', "validationErrors" TEXT[] NOT NULL,
  "createdByAdminId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "P2PSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "P2PPlaybackSession" (
  "id" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "filmId" TEXT NOT NULL, "userId" TEXT NOT NULL, "profileId" TEXT NOT NULL,
  "deliveryMethod" "P2PDeliveryMethod" NOT NULL, "status" "P2PPlaybackStatus" NOT NULL DEFAULT 'IDLE', "sourceStatus" "P2PSourceStatus" NOT NULL,
  "browserCategory" TEXT, "deviceCategory" TEXT, "p2pConsent" BOOLEAN NOT NULL, "peerUploadEnabled" BOOLEAN NOT NULL DEFAULT false,
  "maxDurationSeconds" INTEGER NOT NULL, "maxTransferBytes" BIGINT, "peerCount" INTEGER, "timeToFirstFrameMs" INTEGER,
  "playbackDurationMs" INTEGER NOT NULL DEFAULT 0, "bufferingDurationMs" INTEGER NOT NULL DEFAULT 0,
  "bytesFromPeers" BIGINT NOT NULL DEFAULT 0, "bytesFromOrigin" BIGINT NOT NULL DEFAULT 0, "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  "fallbackOutcome" TEXT, "failureCategory" "P2PFailureCategory", "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endedAt" TIMESTAMP(3),
  CONSTRAINT "P2PPlaybackSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "P2PPlaybackEvent" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "type" TEXT NOT NULL, "progress" DOUBLE PRECISION, "peerCount" INTEGER,
  "bytesFromPeers" BIGINT, "bytesFromOrigin" BIGINT, "durationMs" INTEGER, "failureCategory" "P2PFailureCategory", "details" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "P2PPlaybackEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "P2PExperimentConfig" (
  "id" TEXT NOT NULL DEFAULT 'global', "enabled" BOOLEAN NOT NULL DEFAULT false, "adminEnabled" BOOLEAN NOT NULL DEFAULT false,
  "browserEnabled" BOOLEAN NOT NULL DEFAULT false, "diagnosticsEnabled" BOOLEAN NOT NULL DEFAULT false, "startupTimeoutMs" INTEGER NOT NULL DEFAULT 20000,
  "permittedSourceTypes" "P2PSourceType"[] NOT NULL, "diagnosticsRetentionDays" INTEGER NOT NULL DEFAULT 30, "fallbackEnabled" BOOLEAN NOT NULL DEFAULT true,
  "maxPlaybackDurationSeconds" INTEGER NOT NULL DEFAULT 14400, "maxTransferBytes" BIGINT, "peerUploadEnabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedByAdminId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "P2PExperimentConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "P2PSource_filmId_status_idx" ON "P2PSource"("filmId", "status");
CREATE INDEX "P2PSource_status_updatedAt_idx" ON "P2PSource"("status", "updatedAt");
CREATE INDEX "P2PPlaybackSession_filmId_status_idx" ON "P2PPlaybackSession"("filmId", "status");
CREATE INDEX "P2PPlaybackSession_sourceId_sourceStatus_idx" ON "P2PPlaybackSession"("sourceId", "sourceStatus");
CREATE INDEX "P2PPlaybackSession_profileId_endedAt_idx" ON "P2PPlaybackSession"("profileId", "endedAt");
CREATE INDEX "P2PPlaybackSession_startedAt_idx" ON "P2PPlaybackSession"("startedAt");
CREATE INDEX "P2PPlaybackEvent_sessionId_occurredAt_idx" ON "P2PPlaybackEvent"("sessionId", "occurredAt");
CREATE INDEX "P2PPlaybackEvent_type_occurredAt_idx" ON "P2PPlaybackEvent"("type", "occurredAt");
ALTER TABLE "P2PSource" ADD CONSTRAINT "P2PSource_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "P2PSource" ADD CONSTRAINT "P2PSource_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "P2PPlaybackSession" ADD CONSTRAINT "P2PPlaybackSession_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "P2PSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "P2PPlaybackSession" ADD CONSTRAINT "P2PPlaybackSession_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "P2PPlaybackSession" ADD CONSTRAINT "P2PPlaybackSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "P2PPlaybackSession" ADD CONSTRAINT "P2PPlaybackSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "P2PPlaybackEvent" ADD CONSTRAINT "P2PPlaybackEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "P2PPlaybackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
