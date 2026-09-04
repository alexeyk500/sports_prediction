-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'FINALIZING', 'FINISHED');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'LIVE', 'FINISHED', 'SETTLED');

-- CreateEnum
CREATE TYPE "PredictionOutcome" AS ENUM ('HOME', 'DRAW', 'AWAY');

-- CreateEnum
CREATE TYPE "PredictionResultStatus" AS ENUM ('PENDING', 'CORRECT', 'INCORRECT');

-- CreateEnum
CREATE TYPE "PredictionSlotType" AS ENUM ('FREE', 'REWARDED');

-- CreateEnum
CREATE TYPE "AdRewardStatus" AS ENUM ('CREATED', 'VERIFIED', 'CONSUMED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrizeClaimStatus" AS ENUM ('UNCLAIMED', 'CLAIM_PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RatingLeague" AS ENUM ('UNRANKED', 'BRONZE_III', 'BRONZE_II', 'BRONZE_I', 'SILVER_III', 'SILVER_II', 'SILVER_I', 'GOLD_III', 'GOLD_II', 'GOLD_I', 'PLATINUM_III', 'PLATINUM_II', 'PLATINUM_I', 'DIAMOND_III', 'DIAMOND_II', 'DIAMOND_I', 'MASTER', 'LEGEND');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" UUID NOT NULL,
    "providerCompetitionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "providerTeamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "TournamentStatus" NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "prizePoolNanoTon" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tournamentPoints" INTEGER NOT NULL DEFAULT 0,
    "predictionsCount" INTEGER NOT NULL DEFAULT 0,
    "correctPredictionsCount" INTEGER NOT NULL DEFAULT 0,
    "finalRank" INTEGER,
    "ratingPerformanceZ" DECIMAL(12,8),
    "ratingDelta" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" UUID NOT NULL,
    "providerFixtureId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "homeTeamId" UUID NOT NULL,
    "awayTeamId" UUID NOT NULL,
    "kickoffAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "FixtureStatus" NOT NULL DEFAULT 'DRAFT',
    "providerStatus" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "finalOutcome" "PredictionOutcome",
    "scoringSnapshotId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeSnapshot" (
    "id" UUID NOT NULL,
    "fixtureId" UUID NOT NULL,
    "homeRawOdds" DECIMAL(12,6) NOT NULL,
    "drawRawOdds" DECIMAL(12,6) NOT NULL,
    "awayRawOdds" DECIMAL(12,6) NOT NULL,
    "homeProbability" DECIMAL(10,8) NOT NULL,
    "drawProbability" DECIMAL(10,8) NOT NULL,
    "awayProbability" DECIMAL(10,8) NOT NULL,
    "homePoints" INTEGER NOT NULL,
    "drawPoints" INTEGER NOT NULL,
    "awayPoints" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMPTZ(6) NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "fixtureId" UUID NOT NULL,
    "outcomeSnapshotId" UUID NOT NULL,
    "selectedOutcome" "PredictionOutcome" NOT NULL,
    "slotType" "PredictionSlotType" NOT NULL,
    "probabilityAtPrediction" DECIMAL(10,8) NOT NULL,
    "potentialPoints" INTEGER NOT NULL,
    "resultStatus" "PredictionResultStatus" NOT NULL DEFAULT 'PENDING',
    "earnedPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "settledAt" TIMESTAMPTZ(6),

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPredictionUsage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessDate" DATE NOT NULL,
    "freeUsed" INTEGER NOT NULL DEFAULT 0,
    "rewardedUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DailyPredictionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdReward" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRewardId" TEXT,
    "attemptKey" TEXT NOT NULL,
    "status" "AdRewardStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMPTZ(6),
    "consumedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "consumedByPredictionId" UUID,
    "metadata" JSONB,

    CONSTRAINT "AdReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1500,
    "league" "RatingLeague" NOT NULL DEFAULT 'UNRANKED',
    "qualifiedCupsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RatingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "ratingDelta" INTEGER NOT NULL,
    "performanceZ" DECIMAL(12,8) NOT NULL,
    "actualPercentile" DECIMAL(10,8) NOT NULL,
    "expectedPercentile" DECIMAL(10,8) NOT NULL,
    "leagueBefore" "RatingLeague" NOT NULL,
    "leagueAfter" "RatingLeague" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "unlockedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "amountNanoTon" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeClaim" (
    "id" UUID NOT NULL,
    "prizeId" UUID NOT NULL,
    "walletAddress" TEXT,
    "status" "PrizeClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "transactionHash" TEXT,
    "claimedAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "failedAt" TIMESTAMPTZ(6),
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PrizeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6),

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraints
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_startsAt_before_endsAt_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_prizePoolNanoTon_nonnegative_check" CHECK ("prizePoolNanoTon" >= 0);

ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentPoints_nonnegative_check" CHECK ("tournamentPoints" >= 0);
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_predictionsCount_nonnegative_check" CHECK ("predictionsCount" >= 0);
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_correctPredictionsCount_nonnegative_check" CHECK ("correctPredictionsCount" >= 0);
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_correctPredictionsCount_lte_predictionsCount_check" CHECK ("correctPredictionsCount" <= "predictionsCount");

ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeTeamId_not_awayTeamId_check" CHECK ("homeTeamId" <> "awayTeamId");

ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_homeProbability_range_check" CHECK ("homeProbability" > 0 AND "homeProbability" <= 1);
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_drawProbability_range_check" CHECK ("drawProbability" > 0 AND "drawProbability" <= 1);
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_awayProbability_range_check" CHECK ("awayProbability" > 0 AND "awayProbability" <= 1);
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_homePoints_range_check" CHECK ("homePoints" BETWEEN 7 AND 50);
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_drawPoints_range_check" CHECK ("drawPoints" BETWEEN 7 AND 50);
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_awayPoints_range_check" CHECK ("awayPoints" BETWEEN 7 AND 50);

ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_probabilityAtPrediction_range_check" CHECK ("probabilityAtPrediction" > 0 AND "probabilityAtPrediction" <= 1);
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_potentialPoints_range_check" CHECK ("potentialPoints" BETWEEN 7 AND 50);
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_earnedPoints_nonnegative_check" CHECK ("earnedPoints" >= 0);

ALTER TABLE "DailyPredictionUsage" ADD CONSTRAINT "DailyPredictionUsage_freeUsed_range_check" CHECK ("freeUsed" >= 0 AND "freeUsed" <= 3);
ALTER TABLE "DailyPredictionUsage" ADD CONSTRAINT "DailyPredictionUsage_rewardedUsed_range_check" CHECK ("rewardedUsed" >= 0 AND "rewardedUsed" <= 5);
ALTER TABLE "DailyPredictionUsage" ADD CONSTRAINT "DailyPredictionUsage_totalUsed_limit_check" CHECK ("freeUsed" + "rewardedUsed" <= 8);

ALTER TABLE "RatingProfile" ADD CONSTRAINT "RatingProfile_qualifiedCupsCount_nonnegative_check" CHECK ("qualifiedCupsCount" >= 0);

ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_actualPercentile_range_check" CHECK ("actualPercentile" >= 0 AND "actualPercentile" <= 1);
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_expectedPercentile_range_check" CHECK ("expectedPercentile" >= 0 AND "expectedPercentile" <= 1);

ALTER TABLE "Prize" ADD CONSTRAINT "Prize_rank_positive_check" CHECK ("rank" > 0);
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_amountNanoTon_positive_check" CHECK ("amountNanoTon" > 0);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_providerCompetitionId_key" ON "Competition"("providerCompetitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_code_key" ON "Competition"("code");

-- CreateIndex
CREATE INDEX "Competition_isActive_idx" ON "Competition"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Team_providerTeamId_key" ON "Team"("providerTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_number_key" ON "Tournament"("number");

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "Tournament_startsAt_idx" ON "Tournament"("startsAt");

-- CreateIndex
CREATE INDEX "Tournament_endsAt_idx" ON "Tournament"("endsAt");

-- CreateIndex
CREATE INDEX "Tournament_status_startsAt_endsAt_idx" ON "Tournament"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_tournamentPoints_idx" ON "TournamentParticipant"("tournamentId", "tournamentPoints" DESC);

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_tournamentPoints_id_idx" ON "TournamentParticipant"("tournamentId", "tournamentPoints" DESC, "id");

-- CreateIndex
CREATE INDEX "TournamentParticipant_userId_tournamentId_idx" ON "TournamentParticipant"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_providerFixtureId_key" ON "Fixture"("providerFixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_scoringSnapshotId_key" ON "Fixture"("scoringSnapshotId");

-- CreateIndex
CREATE INDEX "Fixture_kickoffAt_idx" ON "Fixture"("kickoffAt");

-- CreateIndex
CREATE INDEX "Fixture_status_kickoffAt_idx" ON "Fixture"("status", "kickoffAt");

-- CreateIndex
CREATE INDEX "Fixture_competitionId_kickoffAt_idx" ON "Fixture"("competitionId", "kickoffAt");

-- CreateIndex
CREATE INDEX "Fixture_status_competitionId_kickoffAt_idx" ON "Fixture"("status", "competitionId", "kickoffAt");

-- CreateIndex
CREATE INDEX "Fixture_kickoffAt_status_competitionId_idx" ON "Fixture"("kickoffAt", "status", "competitionId");

-- CreateIndex
CREATE INDEX "OutcomeSnapshot_fixtureId_idx" ON "OutcomeSnapshot"("fixtureId");

-- CreateIndex
CREATE INDEX "OutcomeSnapshot_fixtureId_snapshotAt_idx" ON "OutcomeSnapshot"("fixtureId", "snapshotAt" DESC);

-- CreateIndex
CREATE INDEX "Prediction_userId_createdAt_idx" ON "Prediction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Prediction_userId_tournamentId_idx" ON "Prediction"("userId", "tournamentId");

-- CreateIndex
CREATE INDEX "Prediction_tournamentId_resultStatus_idx" ON "Prediction"("tournamentId", "resultStatus");

-- CreateIndex
CREATE INDEX "Prediction_fixtureId_resultStatus_idx" ON "Prediction"("fixtureId", "resultStatus");

-- CreateIndex
CREATE INDEX "Prediction_fixtureId_idx" ON "Prediction"("fixtureId");

-- CreateIndex
CREATE INDEX "Prediction_outcomeSnapshotId_idx" ON "Prediction"("outcomeSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_fixtureId_key" ON "Prediction"("userId", "fixtureId");

-- CreateIndex
CREATE INDEX "DailyPredictionUsage_userId_businessDate_idx" ON "DailyPredictionUsage"("userId", "businessDate");

-- CreateIndex
CREATE INDEX "DailyPredictionUsage_businessDate_idx" ON "DailyPredictionUsage"("businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPredictionUsage_userId_businessDate_key" ON "DailyPredictionUsage"("userId", "businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "AdReward_attemptKey_key" ON "AdReward"("attemptKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdReward_consumedByPredictionId_key" ON "AdReward"("consumedByPredictionId");

-- CreateIndex
CREATE INDEX "AdReward_userId_status_expiresAt_idx" ON "AdReward"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "AdReward_status_expiresAt_idx" ON "AdReward"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdReward_provider_providerRewardId_key" ON "AdReward"("provider", "providerRewardId");

-- CreateIndex
CREATE UNIQUE INDEX "RatingProfile_userId_key" ON "RatingProfile"("userId");

-- CreateIndex
CREATE INDEX "RatingProfile_rating_idx" ON "RatingProfile"("rating" DESC);

-- CreateIndex
CREATE INDEX "RatingProfile_league_rating_idx" ON "RatingProfile"("league", "rating" DESC);

-- CreateIndex
CREATE INDEX "RatingHistory_userId_createdAt_idx" ON "RatingHistory"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RatingHistory_tournamentId_idx" ON "RatingHistory"("tournamentId");

-- CreateIndex
CREATE INDEX "RatingHistory_tournamentId_performanceZ_idx" ON "RatingHistory"("tournamentId", "performanceZ" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RatingHistory_userId_tournamentId_key" ON "RatingHistory"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "Achievement_isActive_idx" ON "Achievement"("isActive");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt" DESC);

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Prize_userId_createdAt_idx" ON "Prize"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Prize_tournamentId_idx" ON "Prize"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Prize_tournamentId_rank_key" ON "Prize"("tournamentId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Prize_tournamentId_userId_key" ON "Prize"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrizeClaim_prizeId_key" ON "PrizeClaim"("prizeId");

-- CreateIndex
CREATE INDEX "PrizeClaim_status_idx" ON "PrizeClaim"("status");

-- CreateIndex
CREATE INDEX "PrizeClaim_walletAddress_idx" ON "PrizeClaim"("walletAddress");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_userId_operation_createdAt_idx" ON "IdempotencyRecord"("userId", "operation", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_userId_operation_key_key" ON "IdempotencyRecord"("userId", "operation", "key");

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_scoringSnapshotId_fkey" FOREIGN KEY ("scoringSnapshotId") REFERENCES "OutcomeSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomeSnapshot" ADD CONSTRAINT "OutcomeSnapshot_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_outcomeSnapshotId_fkey" FOREIGN KEY ("outcomeSnapshotId") REFERENCES "OutcomeSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPredictionUsage" ADD CONSTRAINT "DailyPredictionUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdReward" ADD CONSTRAINT "AdReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdReward" ADD CONSTRAINT "AdReward_consumedByPredictionId_fkey" FOREIGN KEY ("consumedByPredictionId") REFERENCES "Prediction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingProfile" ADD CONSTRAINT "RatingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizeClaim" ADD CONSTRAINT "PrizeClaim_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
