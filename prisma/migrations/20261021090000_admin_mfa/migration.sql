ALTER TABLE "Session" ADD COLUMN "mfaVerifiedAt" TIMESTAMP(3);

CREATE TABLE "AdminMfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminMfaRecoveryCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminMfaRecoveryCode_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AdminMfaRecoveryCode_codeHash_key" ON "AdminMfaRecoveryCode"("codeHash");
CREATE INDEX "AdminMfaRecoveryCode_adminUserId_usedAt_idx" ON "AdminMfaRecoveryCode"("adminUserId", "usedAt");

-- Manual rollback: DROP TABLE "AdminMfaRecoveryCode"; ALTER TABLE "Session" DROP COLUMN "mfaVerifiedAt";
