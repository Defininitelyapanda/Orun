ALTER TYPE "AdminRoleName" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "AdminRoleName" ADD VALUE IF NOT EXISTS 'TECHNICAL_ADMIN';
ALTER TYPE "AdminRoleName" ADD VALUE IF NOT EXISTS 'CUSTOMER_SUPPORT';
ALTER TABLE "AdminUser" ADD COLUMN "lastSensitiveAuthAt" TIMESTAMP(3);
ALTER TABLE "AuditLog"
  ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'SUCCEEDED',
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "metadata" JSONB;
CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");
CREATE OR REPLACE FUNCTION orun_reject_audit_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'AuditLog records are append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditLog_append_only" BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION orun_reject_audit_mutation();

-- Rollback (manual, after preserving exported audit history):
-- DROP TRIGGER IF EXISTS "AuditLog_append_only" ON "AuditLog";
-- DROP FUNCTION IF EXISTS orun_reject_audit_mutation();
-- DROP INDEX IF EXISTS "AuditLog_correlationId_idx";
-- DROP INDEX IF EXISTS "AuditLog_action_createdAt_idx";
-- DROP INDEX IF EXISTS "AuditLog_adminUserId_createdAt_idx";
-- ALTER TABLE "AuditLog" DROP COLUMN "metadata", DROP COLUMN "correlationId", DROP COLUMN "requestId", DROP COLUMN "reason", DROP COLUMN "outcome";
-- ALTER TABLE "AdminUser" DROP COLUMN "lastSensitiveAuthAt";
-- PostgreSQL enum values are intentionally retained during rollback.
