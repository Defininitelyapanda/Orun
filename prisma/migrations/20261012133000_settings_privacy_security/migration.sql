CREATE TYPE "DataRequestStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'READY', 'EXPIRED', 'FAILED', 'CANCELLED');
CREATE TYPE "AccountDeletionStatus" AS ENUM ('REQUESTED', 'VERIFYING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED');

CREATE TABLE "AccountPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
  "interfaceLanguage" TEXT NOT NULL DEFAULT 'en', "regionCode" VARCHAR(2),
  "timeZone" TEXT NOT NULL DEFAULT 'Africa/Nairobi', "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
  "dateTimeFormat" TEXT NOT NULL DEFAULT 'REGIONAL', "browsingDensity" TEXT NOT NULL DEFAULT 'COMFORTABLE',
  "reduceMotion" BOOLEAN NOT NULL DEFAULT false, "highContrast" BOOLEAN NOT NULL DEFAULT false,
  "largerText" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccountPreference_userId_key" ON "AccountPreference"("userId");
ALTER TABLE "AccountPreference" ADD CONSTRAINT "AccountPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProfilePreference" (
  "id" TEXT NOT NULL, "profileId" TEXT NOT NULL, "contentLanguage" TEXT NOT NULL DEFAULT 'en',
  "preferredGenres" TEXT[] DEFAULT ARRAY[]::TEXT[], "durationMin" INTEGER NOT NULL DEFAULT 0,
  "durationMax" INTEGER NOT NULL DEFAULT 240, "preferredCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "audioLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[], "subtitleLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "hideWatched" BOOLEAN NOT NULL DEFAULT false, "allowOutsideGenres" BOOLEAN NOT NULL DEFAULT true,
  "showDescriptions" BOOLEAN NOT NULL DEFAULT true, "showRatings" BOOLEAN NOT NULL DEFAULT true,
  "showMetadata" BOOLEAN NOT NULL DEFAULT true, "personalizedRecommendations" BOOLEAN NOT NULL DEFAULT true,
  "useWatchHistory" BOOLEAN NOT NULL DEFAULT true, "useRatings" BOOLEAN NOT NULL DEFAULT true,
  "continueWatchingPersonalization" BOOLEAN NOT NULL DEFAULT true, "homepagePersonalization" BOOLEAN NOT NULL DEFAULT true,
  "browsingPersonalization" BOOLEAN NOT NULL DEFAULT false, "playbackQuality" TEXT NOT NULL DEFAULT 'AUTO',
  "autoplayNext" BOOLEAN NOT NULL DEFAULT true, "autoplayTrailers" BOOLEAN NOT NULL DEFAULT true,
  "rememberPosition" BOOLEAN NOT NULL DEFAULT true, "resumeUnfinished" BOOLEAN NOT NULL DEFAULT true,
  "showPlaybackControls" BOOLEAN NOT NULL DEFAULT true, "defaultSubtitles" TEXT NOT NULL DEFAULT 'MATCH_CONTENT',
  "preferredAudioTrack" TEXT NOT NULL DEFAULT 'ORIGINAL', "playbackSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "skipIntro" BOOLEAN NOT NULL DEFAULT false, "skipRecap" BOOLEAN NOT NULL DEFAULT false,
  "lowerBandwidth" BOOLEAN NOT NULL DEFAULT false, "adaptiveQuality" BOOLEAN NOT NULL DEFAULT true,
  "subtitleSize" TEXT NOT NULL DEFAULT 'MEDIUM', "subtitleColor" TEXT NOT NULL DEFAULT '#FFFFFF',
  "subtitleBackground" TEXT NOT NULL DEFAULT '#000000', "subtitleBackgroundOpacity" INTEGER NOT NULL DEFAULT 75,
  "subtitleOutline" TEXT NOT NULL DEFAULT 'SHADOW', "subtitlePosition" TEXT NOT NULL DEFAULT 'BOTTOM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfilePreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProfilePreference_profileId_key" ON "ProfilePreference"("profileId");
ALTER TABLE "ProfilePreference" ADD CONSTRAINT "ProfilePreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PrivacyPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productAnalytics" BOOLEAN NOT NULL DEFAULT false,
  "personalizedMeasurement" BOOLEAN NOT NULL DEFAULT false, "diagnosticReporting" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PrivacyPreference_userId_key" ON "PrivacyPreference"("userId");
ALTER TABLE "PrivacyPreference" ADD CONSTRAINT "PrivacyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "promotionalEmail" BOOLEAN NOT NULL DEFAULT false,
  "newReleaseEmail" BOOLEAN NOT NULL DEFAULT false, "recommendationEmail" BOOLEAN NOT NULL DEFAULT false,
  "watchlistEmail" BOOLEAN NOT NULL DEFAULT false, "pushNewReleases" BOOLEAN NOT NULL DEFAULT false,
  "pushWatchlist" BOOLEAN NOT NULL DEFAULT false, "pushRecommendations" BOOLEAN NOT NULL DEFAULT false,
  "pushSubscriptionReminders" BOOLEAN NOT NULL DEFAULT false, "inAppAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "inAppAccountEvents" BOOLEAN NOT NULL DEFAULT true, "inAppContentAvailability" BOOLEAN NOT NULL DEFAULT true,
  "inAppBillingEvents" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CookieConsent" (
  "id" TEXT NOT NULL, "userId" TEXT, "policyVersion" TEXT NOT NULL,
  "preferences" BOOLEAN NOT NULL DEFAULT false, "analytics" BOOLEAN NOT NULL DEFAULT false,
  "advertising" BOOLEAN NOT NULL DEFAULT false, "regionCode" VARCHAR(2),
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "withdrawnAt" TIMESTAMP(3),
  CONSTRAINT "CookieConsent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CookieConsent_userId_recordedAt_idx" ON "CookieConsent"("userId", "recordedAt");
ALTER TABLE "CookieConsent" ADD CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DataExportRequest" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" "DataRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "storageKey" TEXT, "downloadTokenHash" TEXT, "expiresAt" TIMESTAMP(3), "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3), CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DataExportRequest_downloadTokenHash_key" ON "DataExportRequest"("downloadTokenHash");
CREATE INDEX "DataExportRequest_userId_createdAt_idx" ON "DataExportRequest"("userId", "createdAt");
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "status" "AccountDeletionStatus" NOT NULL DEFAULT 'REQUESTED', "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "failureReason" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "summary" TEXT NOT NULL,
  "ipHash" TEXT, "userAgent" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PrivacyAuditEvent" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "action" TEXT NOT NULL, "category" TEXT NOT NULL,
  "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivacyAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PrivacyAuditEvent_userId_createdAt_idx" ON "PrivacyAuditEvent"("userId", "createdAt");
ALTER TABLE "PrivacyAuditEvent" ADD CONSTRAINT "PrivacyAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
