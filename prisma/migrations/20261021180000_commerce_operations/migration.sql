CREATE TYPE "RefundWorkflowStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "ReconciliationStatus" AS ENUM ('MATCHED', 'MISMATCH', 'MISSING_PROVIDER', 'RESOLVED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEEDS_RESPONSE', 'WON', 'LOST', 'CLOSED');

ALTER TABLE "Refund"
  ADD COLUMN "workflowStatus" "RefundWorkflowStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "requestedByAdminId" TEXT,
  ADD COLUMN "approvedByAdminId" TEXT,
  ADD COLUMN "rejectedByAdminId" TEXT,
  ADD COLUMN "decisionReason" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "executedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Refund" SET "idempotencyKey" = CONCAT('legacy-', "id"), "requestedByAdminId" = 'SYSTEM', "workflowStatus" = CASE WHEN "status" IN ('REFUNDED', 'PARTIALLY_REFUNDED') THEN 'SUCCEEDED'::"RefundWorkflowStatus" WHEN "status" = 'FAILED' THEN 'FAILED'::"RefundWorkflowStatus" ELSE 'PENDING_APPROVAL'::"RefundWorkflowStatus" END;
ALTER TABLE "Refund" ALTER COLUMN "idempotencyKey" SET NOT NULL, ALTER COLUMN "requestedByAdminId" SET NOT NULL;
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE INDEX "Refund_paymentId_workflowStatus_idx" ON "Refund"("paymentId", "workflowStatus");

CREATE TABLE "PaymentReconciliation" (
  "id" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "status" "ReconciliationStatus" NOT NULL,
  "providerStatus" "PaymentStatus", "providerAmount" BIGINT, "providerCurrency" VARCHAR(3), "notes" TEXT,
  "checkedByAdminId" TEXT NOT NULL, "resolvedByAdminId" TEXT, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentReconciliation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PaymentReconciliation_paymentId_createdAt_idx" ON "PaymentReconciliation"("paymentId", "createdAt");
CREATE INDEX "PaymentReconciliation_status_createdAt_idx" ON "PaymentReconciliation"("status", "createdAt");

CREATE TABLE "PaymentDispute" (
  "id" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "providerDisputeId" TEXT, "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT NOT NULL, "amount" BIGINT, "currency" VARCHAR(3), "responseDueAt" TIMESTAMP(3), "notes" TEXT,
  "openedByAdminId" TEXT NOT NULL, "resolvedByAdminId" TEXT, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentDispute_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentDispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PaymentDispute_paymentId_status_idx" ON "PaymentDispute"("paymentId", "status");
CREATE INDEX "PaymentDispute_status_responseDueAt_idx" ON "PaymentDispute"("status", "responseDueAt");

-- Manual rollback requires dropping PaymentDispute and PaymentReconciliation, removing the added Refund columns and indexes, then dropping the three enums.
