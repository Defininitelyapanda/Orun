ALTER TABLE "Film"
  ADD COLUMN "contentFormat" TEXT NOT NULL DEFAULT 'FEATURE_FILM',
  ADD COLUMN "region" TEXT,
  ADD COLUMN "dubbedLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "subtitleLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "videoQualities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "trending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "privateMessagesEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Genre" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Comment" ADD COLUMN "creatorReply" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "helpfulCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "StoryTheme" ("id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL UNIQUE, "active" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0);
CREATE TABLE "FilmStoryTheme" ("filmId" TEXT NOT NULL, "themeId" TEXT NOT NULL, PRIMARY KEY ("filmId", "themeId"));
CREATE TABLE "FilmCreatorRecipient" ("filmId" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "privateMessagesEnabled" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "FilmRatingAggregate" ("filmId" TEXT PRIMARY KEY, "average" DOUBLE PRECISION NOT NULL DEFAULT 0, "count" INTEGER NOT NULL DEFAULT 0, "distribution" JSONB NOT NULL, "bayesianScore" DOUBLE PRECISION NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "CreatorConversation" ("id" TEXT PRIMARY KEY, "filmId" TEXT NOT NULL, "senderProfileId" TEXT NOT NULL, "recipientUserId" TEXT NOT NULL, "senderArchivedAt" TIMESTAMP(3), "recipientArchivedAt" TIMESTAMP(3), "senderReadAt" TIMESTAMP(3), "recipientReadAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "CreatorMessage" ("id" TEXT PRIMARY KEY, "conversationId" TEXT NOT NULL, "senderUserId" TEXT NOT NULL, "body" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'VISIBLE', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "UserBlock" ("blockerUserId" TEXT NOT NULL, "blockedUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY ("blockerUserId", "blockedUserId"));
CREATE TABLE "TrailerAsset" ("id" TEXT PRIMARY KEY, "filmId" TEXT NOT NULL, "url" TEXT NOT NULL, "thumbnailUrl" TEXT, "languageCode" TEXT NOT NULL DEFAULT 'en', "durationSeconds" INTEGER, "available" BOOLEAN NOT NULL DEFAULT true, "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);

CREATE UNIQUE INDEX "CreatorConversation_filmId_senderProfileId_recipientUserId_key" ON "CreatorConversation"("filmId", "senderProfileId", "recipientUserId");
CREATE INDEX "Film_status_year_id_idx" ON "Film"("status", "year", "id");
CREATE INDEX "Film_status_trending_popularityScore_idx" ON "Film"("status", "trending", "popularityScore");
CREATE INDEX "Film_contentFormat_region_idx" ON "Film"("contentFormat", "region");
CREATE INDEX "FilmGenre_genreId_filmId_idx" ON "FilmGenre"("genreId", "filmId");
CREATE INDEX "FilmStoryTheme_themeId_filmId_idx" ON "FilmStoryTheme"("themeId", "filmId");
CREATE INDEX "FilmCreatorRecipient_userId_filmId_idx" ON "FilmCreatorRecipient"("userId", "filmId");
CREATE INDEX "Rating_filmId_active_value_idx" ON "Rating"("filmId", "active", "value");
CREATE INDEX "FilmRatingAggregate_bayesianScore_count_idx" ON "FilmRatingAggregate"("bayesianScore", "count");
CREATE INDEX "Comment_filmId_status_createdAt_idx" ON "Comment"("filmId", "status", "createdAt");
CREATE INDEX "Comment_filmId_status_helpfulCount_createdAt_idx" ON "Comment"("filmId", "status", "helpfulCount", "createdAt");
CREATE INDEX "Comment_parentId_status_createdAt_idx" ON "Comment"("parentId", "status", "createdAt");
CREATE INDEX "CreatorConversation_recipientUserId_recipientArchivedAt_updatedAt_idx" ON "CreatorConversation"("recipientUserId", "recipientArchivedAt", "updatedAt");
CREATE INDEX "CreatorConversation_senderProfileId_senderArchivedAt_updatedAt_idx" ON "CreatorConversation"("senderProfileId", "senderArchivedAt", "updatedAt");
CREATE INDEX "CreatorMessage_conversationId_createdAt_idx" ON "CreatorMessage"("conversationId", "createdAt");
CREATE INDEX "TrailerAsset_filmId_available_approvedAt_idx" ON "TrailerAsset"("filmId", "available", "approvedAt");

ALTER TABLE "CreatorMessage" ADD CONSTRAINT "CreatorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CreatorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing scalar IDs intentionally remain loosely coupled until legacy rows have been audited.
-- Application authorization resolves each ID before writes; a later hardening migration may add FKs.
