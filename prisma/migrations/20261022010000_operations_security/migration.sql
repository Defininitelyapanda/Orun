CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED');

CREATE TABLE "AnalyticsAggregate" ("id" TEXT NOT NULL, "day" DATE NOT NULL, "metric" TEXT NOT NULL, "dimensionHash" TEXT NOT NULL, "dimensions" JSONB NOT NULL, "count" BIGINT NOT NULL DEFAULT 0, "total" DOUBLE PRECISION, "consentScope" TEXT NOT NULL DEFAULT 'PRODUCT_ANALYTICS', "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AnalyticsAggregate_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "AnalyticsAggregate_day_metric_dimensionHash_key" ON "AnalyticsAggregate"("day", "metric", "dimensionHash");
CREATE INDEX "AnalyticsAggregate_metric_day_idx" ON "AnalyticsAggregate"("metric", "day");

CREATE TABLE "FeatureFlag" ("key" TEXT NOT NULL, "description" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false, "rolloutPercent" INTEGER NOT NULL DEFAULT 0, "rules" JSONB, "version" INTEGER NOT NULL DEFAULT 1, "updatedByAdminId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key"), CONSTRAINT "FeatureFlag_rollout_check" CHECK ("rolloutPercent" BETWEEN 0 AND 100));
CREATE TABLE "FeatureFlagRevision" ("id" TEXT NOT NULL, "flagKey" TEXT NOT NULL, "version" INTEGER NOT NULL, "enabled" BOOLEAN NOT NULL, "rolloutPercent" INTEGER NOT NULL, "rules" JSONB, "reason" TEXT NOT NULL, "createdByAdminId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FeatureFlagRevision_pkey" PRIMARY KEY ("id"), CONSTRAINT "FeatureFlagRevision_flagKey_fkey" FOREIGN KEY ("flagKey") REFERENCES "FeatureFlag"("key") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "FeatureFlagRevision_flagKey_version_key" ON "FeatureFlagRevision"("flagKey", "version");

CREATE TABLE "SecurityAlert" ("id" TEXT NOT NULL, "fingerprint" TEXT NOT NULL, "source" TEXT NOT NULL, "severity" "AlertSeverity" NOT NULL, "status" "AlertStatus" NOT NULL DEFAULT 'OPEN', "title" TEXT NOT NULL, "details" JSONB, "occurrences" INTEGER NOT NULL DEFAULT 1, "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "acknowledgedByAdminId" TEXT, "resolvedByAdminId" TEXT, "resolution" TEXT, "resolvedAt" TIMESTAMP(3), CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "SecurityAlert_fingerprint_key" ON "SecurityAlert"("fingerprint");
CREATE INDEX "SecurityAlert_status_severity_lastSeenAt_idx" ON "SecurityAlert"("status", "severity", "lastSeenAt");

CREATE TABLE "Incident" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT NOT NULL, "severity" "AlertSeverity" NOT NULL, "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN', "commanderAdminId" TEXT NOT NULL, "resolution" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "mitigatedAt" TIMESTAMP(3), "resolvedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Incident_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Incident_status_severity_startedAt_idx" ON "Incident"("status", "severity", "startedAt");

CREATE TABLE "SecretRotationRecord" ("id" TEXT NOT NULL, "system" TEXT NOT NULL, "keyAlias" TEXT NOT NULL, "status" TEXT NOT NULL, "rotatedAt" TIMESTAMP(3) NOT NULL, "nextRotationDueAt" TIMESTAMP(3) NOT NULL, "evidenceReference" TEXT, "recordedByAdminId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SecretRotationRecord_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "SecretRotationRecord_system_keyAlias_rotatedAt_key" ON "SecretRotationRecord"("system", "keyAlias", "rotatedAt");
CREATE INDEX "SecretRotationRecord_status_nextRotationDueAt_idx" ON "SecretRotationRecord"("status", "nextRotationDueAt");

-- Manual rollback: drop the five tables above, then drop IncidentStatus, AlertStatus and AlertSeverity.
