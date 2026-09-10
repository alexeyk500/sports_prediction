ALTER TYPE "PrizeClaimStatus" RENAME TO "PrizeClaimStatus_old";

CREATE TYPE "PrizeClaimStatus" AS ENUM (
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'PAID',
  'REJECTED'
);

ALTER TABLE "PrizeClaim" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PrizeClaim"
ALTER COLUMN "status" TYPE "PrizeClaimStatus"
USING (
  CASE "status"::text
    WHEN 'PAID' THEN 'PAID'
    WHEN 'FAILED' THEN 'REJECTED'
    ELSE 'UNDER_REVIEW'
  END
)::"PrizeClaimStatus";
ALTER TABLE "PrizeClaim" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW';

DROP TYPE "PrizeClaimStatus_old";

ALTER TABLE "PrizeClaim" DROP CONSTRAINT "PrizeClaim_prizeId_fkey";
ALTER TABLE "Prize" DROP CONSTRAINT "Prize_amountNanoTon_positive_check";
ALTER TABLE "Prize" DROP CONSTRAINT "Prize_rank_positive_check";

ALTER TABLE "Prize" RENAME TO "PrizeEntitlement";
ALTER TABLE "PrizeEntitlement" RENAME COLUMN "rank" TO "finalPlacement";
ALTER TABLE "PrizeEntitlement" RENAME COLUMN "amountNanoTon" TO "amount";
ALTER TABLE "PrizeEntitlement"
ALTER COLUMN "amount" TYPE NUMERIC(20,8)
USING ("amount"::numeric / 1000000000);
ALTER TABLE "PrizeEntitlement"
ADD COLUMN "asset" VARCHAR(12) NOT NULL DEFAULT 'USDT',
ADD COLUMN "network" VARCHAR(24) NOT NULL DEFAULT 'TRC20',
ADD COLUMN "settledAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW();

ALTER TABLE "PrizeClaim" RENAME COLUMN "prizeId" TO "entitlementId";
ALTER TABLE "PrizeClaim" ALTER COLUMN "walletAddress" SET DATA TYPE VARCHAR(64);
UPDATE "PrizeClaim" SET "walletAddress" = 'T111111111111111111111111111111111' WHERE "walletAddress" IS NULL;
ALTER TABLE "PrizeClaim" ALTER COLUMN "walletAddress" SET NOT NULL;
ALTER TABLE "PrizeClaim" ALTER COLUMN "claimedAt" SET DEFAULT NOW();
UPDATE "PrizeClaim" SET "claimedAt" = "createdAt" WHERE "claimedAt" IS NULL;
ALTER TABLE "PrizeClaim" ALTER COLUMN "claimedAt" SET NOT NULL;
ALTER TABLE "PrizeClaim" ALTER COLUMN "claimedAt" DROP DEFAULT;
ALTER TABLE "PrizeClaim"
ADD COLUMN "userId" UUID,
ADD COLUMN "actionRequiredMessage" TEXT,
ADD COLUMN "rejectionReason" TEXT;
UPDATE "PrizeClaim" pc
SET "userId" = pe."userId"
FROM "PrizeEntitlement" pe
WHERE pc."entitlementId" = pe."id";
ALTER TABLE "PrizeClaim" ALTER COLUMN "userId" SET NOT NULL;
UPDATE "PrizeClaim" SET "rejectionReason" = "failureReason" WHERE "status" = 'REJECTED';
UPDATE "PrizeClaim" SET "rejectionReason" = 'Rejected by operator.' WHERE "status" = 'REJECTED' AND "rejectionReason" IS NULL;
ALTER TABLE "PrizeClaim" DROP COLUMN "failedAt";
ALTER TABLE "PrizeClaim" DROP COLUMN "failureReason";
ALTER TABLE "PrizeClaim" ALTER COLUMN "transactionHash" SET DATA TYPE VARCHAR(128);

ALTER INDEX "Prize_pkey" RENAME TO "PrizeEntitlement_pkey";
ALTER INDEX "Prize_tournamentId_rank_key" RENAME TO "PrizeEntitlement_tournamentId_finalPlacement_key";
ALTER INDEX "Prize_tournamentId_userId_key" RENAME TO "PrizeEntitlement_tournamentId_userId_key";
ALTER INDEX "Prize_userId_createdAt_idx" RENAME TO "PrizeEntitlement_userId_createdAt_idx";
ALTER INDEX "Prize_tournamentId_idx" RENAME TO "PrizeEntitlement_tournamentId_idx";
ALTER INDEX "PrizeClaim_prizeId_key" RENAME TO "PrizeClaim_entitlementId_key";

ALTER TABLE "PrizeEntitlement" RENAME CONSTRAINT "Prize_tournamentId_fkey" TO "PrizeEntitlement_tournamentId_fkey";
ALTER TABLE "PrizeEntitlement" RENAME CONSTRAINT "Prize_userId_fkey" TO "PrizeEntitlement_userId_fkey";
ALTER TABLE "PrizeEntitlement"
ADD CONSTRAINT "PrizeEntitlement_finalPlacement_positive_check" CHECK ("finalPlacement" > 0),
ADD CONSTRAINT "PrizeEntitlement_amount_positive_check" CHECK ("amount" > 0),
ADD CONSTRAINT "PrizeEntitlement_asset_usdt_check" CHECK ("asset" = 'USDT'),
ADD CONSTRAINT "PrizeEntitlement_network_trc20_check" CHECK ("network" = 'TRC20');

ALTER TABLE "PrizeClaim"
ADD CONSTRAINT "PrizeClaim_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "PrizeEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "PrizeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "PrizeClaim_action_required_message_check" CHECK ("status" <> 'ACTION_REQUIRED' OR "actionRequiredMessage" IS NOT NULL),
ADD CONSTRAINT "PrizeClaim_rejected_reason_check" CHECK ("status" <> 'REJECTED' OR "rejectionReason" IS NOT NULL),
ADD CONSTRAINT "PrizeClaim_paid_at_check" CHECK ("status" <> 'PAID' OR "paidAt" IS NOT NULL),
ADD CONSTRAINT "PrizeClaim_wallet_trc20_format_check" CHECK ("walletAddress" ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$');

CREATE INDEX "PrizeClaim_userId_createdAt_idx" ON "PrizeClaim"("userId", "createdAt" DESC);
CREATE INDEX "PrizeClaim_status_updatedAt_idx" ON "PrizeClaim"("status", "updatedAt" DESC);

CREATE TABLE "PrizeWalletRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "claimId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "previousWalletAddress" VARCHAR(64) NOT NULL,
  "nextWalletAddress" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrizeWalletRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrizeWalletRevision_claimId_createdAt_idx" ON "PrizeWalletRevision"("claimId", "createdAt" DESC);
CREATE INDEX "PrizeWalletRevision_userId_createdAt_idx" ON "PrizeWalletRevision"("userId", "createdAt" DESC);

ALTER TABLE "PrizeWalletRevision"
ADD CONSTRAINT "PrizeWalletRevision_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PrizeClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "PrizeWalletRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "PrizeWalletRevision_previous_wallet_trc20_format_check" CHECK ("previousWalletAddress" ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$'),
ADD CONSTRAINT "PrizeWalletRevision_next_wallet_trc20_format_check" CHECK ("nextWalletAddress" ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$');
