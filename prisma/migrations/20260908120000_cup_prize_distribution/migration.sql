CREATE TYPE "PrizeCurrency" AS ENUM ('USDT', 'TON');

ALTER TABLE "Tournament"
ADD COLUMN "prizeCurrency" "PrizeCurrency" NOT NULL DEFAULT 'USDT';

CREATE TABLE "PrizeDistributionTier" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "fromRank" INTEGER NOT NULL,
    "toRank" INTEGER NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PrizeDistributionTier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrizeDistributionTier_tournamentId_sortOrder_key"
ON "PrizeDistributionTier"("tournamentId", "sortOrder");

CREATE INDEX "PrizeDistributionTier_tournamentId_sortOrder_idx"
ON "PrizeDistributionTier"("tournamentId", "sortOrder");

ALTER TABLE "PrizeDistributionTier"
ADD CONSTRAINT "PrizeDistributionTier_tournamentId_fkey"
FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
