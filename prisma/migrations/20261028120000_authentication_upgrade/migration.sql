ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "username" TEXT,
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

ALTER TABLE "Session"
  ADD COLUMN "remembered" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "VerificationChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VerificationChallenge_userId_kind_createdAt_idx" ON "VerificationChallenge"("userId", "kind", "createdAt");
CREATE INDEX "VerificationChallenge_target_kind_expiresAt_idx" ON "VerificationChallenge"("target", "kind", "expiresAt");
