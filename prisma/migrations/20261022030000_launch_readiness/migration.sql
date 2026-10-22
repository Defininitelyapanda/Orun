CREATE TYPE "ReadinessEvidenceKind" AS ENUM ('MIGRATION_REHEARSAL', 'BACKUP_RESTORE', 'ROLLBACK_EXERCISE', 'E2E_TEST', 'SECURITY_TEST', 'LOAD_TEST', 'OBSERVABILITY_CHECK');
CREATE TYPE "EvidenceResult" AS ENUM ('PASS', 'FAIL');
CREATE TYPE "LaunchDecision" AS ENUM ('APPROVED', 'BLOCKED');

CREATE TABLE "ReadinessEvidence" ("id" TEXT NOT NULL, "kind" "ReadinessEvidenceKind" NOT NULL, "result" "EvidenceResult" NOT NULL, "environment" TEXT NOT NULL, "releaseVersion" TEXT, "evidenceReference" TEXT NOT NULL, "notes" TEXT, "performedAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "recordedByAdminId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ReadinessEvidence_pkey" PRIMARY KEY ("id"));
CREATE INDEX "ReadinessEvidence_kind_environment_performedAt_idx" ON "ReadinessEvidence"("kind", "environment", "performedAt");

CREATE TABLE "LaunchDecisionRecord" ("id" TEXT NOT NULL, "releaseVersion" TEXT NOT NULL, "environment" TEXT NOT NULL, "decision" "LaunchDecision" NOT NULL, "readinessSnapshot" JSONB NOT NULL, "reason" TEXT NOT NULL, "decidedByAdminId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LaunchDecisionRecord_pkey" PRIMARY KEY ("id"));
CREATE INDEX "LaunchDecisionRecord_releaseVersion_environment_createdAt_idx" ON "LaunchDecisionRecord"("releaseVersion", "environment", "createdAt");

-- Evidence records and decisions are retained as operational history. Rollback requires an explicit archive/export before dropping these tables and enums.
