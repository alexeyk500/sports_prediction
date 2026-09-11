import { createHash } from "node:crypto";
import {
  Prisma,
  type Prediction,
  type PredictionOutcome,
  type PrismaClient,
} from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  type UtcDateKey,
  utcDateKeyToDatabaseDate,
  getUtcDayRange,
  getUtcDateKey,
} from "@/lib/time/utc-day";
import type { Clock } from "@/lib/time/clock";
import { assertFixtureEligibleForPrediction } from "@/modules/fixtures/fixture.domain";
import { findActiveTournamentForInstant } from "@/modules/tournaments/tournament.service";
import {
  FREE_PREDICTION_LIMIT,
  getSnapshotValuesForOutcome,
  resolvePredictionSlotType,
} from "./prediction.domain";

const CREATE_PREDICTION_OPERATION = "CREATE_PREDICTION";

export interface PredictionServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export interface CreatePredictionInput {
  userId: string;
  fixtureId: string;
  selectedOutcome: PredictionOutcome;
  adRewardId?: string;
  idempotencyKey: string;
}

export interface UpdatePredictionInput {
  userId: string;
  predictionId: string;
  selectedOutcome: PredictionOutcome;
}

export interface CancelPredictionInput {
  userId: string;
  predictionId: string;
}

export interface PredictionMutationResult {
  predictionId: string;
  userId: string;
  tournamentId: string;
  fixtureId: string;
  outcomeSnapshotId: string;
  selectedOutcome: PredictionOutcome;
  slotType: "FREE" | "REWARDED";
  probabilityAtPrediction: string;
  potentialPoints: number;
}

export interface CancelPredictionResult {
  predictionId: string;
  userId: string;
  tournamentId: string;
  fixtureId: string;
  slotType: "FREE" | "REWARDED";
}

interface LockedFixtureRow {
  id: string;
  status: "DRAFT" | "OPEN" | "LOCKED" | "LIVE" | "FINISHED" | "SETTLED";
  kickoffAt: Date;
  scoringSnapshotId: string | null;
  competitionCode: string;
  competitionIsActive: boolean;
}

interface LockedPredictionRow {
  id: string;
  userId: string;
  tournamentId: string;
  fixtureId: string;
  outcomeSnapshotId: string;
  slotType: "FREE" | "REWARDED";
  kickoffAt: Date;
}

interface LockedAdRewardRow {
  id: string;
  userId: string;
  status: "CREATED" | "VERIFIED" | "CONSUMED" | "EXPIRED" | "REJECTED";
  consumedByPredictionId: string | null;
  expiresAt: Date | null;
}

export async function createPrediction(
  dependencies: PredictionServiceDependencies,
  input: CreatePredictionInput,
): Promise<PredictionMutationResult> {
  const now = dependencies.clock.now();
  const businessDate = getUtcDateKey(now);
  const requestHash = hashCreatePredictionInput(input);

  return dependencies.prisma.$transaction(
    async (tx) => {
      await lockCreatePredictionIdempotencyScope(tx, input);
      const idempotency = await lockCreatePredictionIdempotencyRecord(
        tx,
        input,
        requestHash,
      );

      if (idempotency.responseBody) {
        return idempotency.responseBody as unknown as PredictionMutationResult;
      }

      const tournament = await findActiveTournamentForInstant(
        { prisma: tx },
        now,
      );

      if (!tournament) {
        throw new DomainError(
          "NO_ACTIVE_TOURNAMENT",
          "No active tournament found.",
          {
            instant: now.toISOString(),
          },
        );
      }

      const fixture = await lockFixture(tx, input.fixtureId);

      if (!fixture) {
        throw new DomainError("FIXTURE_NOT_FOUND", "Fixture not found.", {
          fixtureId: input.fixtureId,
        });
      }

      if (getUtcDateKey(fixture.kickoffAt) !== businessDate) {
        throw new DomainError(
          "FIXTURE_NOT_IN_DAILY_POOL",
          "Fixture is not in the current daily match pool.",
          {
            fixtureId: fixture.id,
            businessDate,
            fixtureUtcDateKey: getUtcDateKey(fixture.kickoffAt),
          },
        );
      }

      assertFixtureIsEligibleForPredictionCreation(fixture, now);

      const snapshot = await tx.outcomeSnapshot.findUniqueOrThrow({
        where: { id: fixture.scoringSnapshotId ?? "" },
      });
      const selectedOutcomeValues = getSnapshotValuesForOutcome(
        snapshot,
        input.selectedOutcome,
      );

      await lockDailyUsageScope(tx, input.userId, businessDate);
      const usage = await tx.dailyPredictionUsage.upsert({
        where: {
          userId_businessDate: {
            userId: input.userId,
            businessDate: utcDateKeyToDatabaseDate(businessDate),
          },
        },
        update: {},
        create: {
          userId: input.userId,
          businessDate: utcDateKeyToDatabaseDate(businessDate),
        },
      });
      const slotType = resolvePredictionSlotType(
        usage,
        Boolean(input.adRewardId),
      );
      const adReward =
        slotType === "REWARDED"
          ? await lockAndValidateAdReward(tx, input, now)
          : null;

      await tx.tournamentParticipant.upsert({
        where: {
          tournamentId_userId: {
            tournamentId: tournament.id,
            userId: input.userId,
          },
        },
        update: {},
        create: {
          tournamentId: tournament.id,
          userId: input.userId,
        },
      });

      let prediction: Prediction;

      try {
        prediction = await tx.prediction.create({
          data: {
            userId: input.userId,
            tournamentId: tournament.id,
            fixtureId: fixture.id,
            outcomeSnapshotId: snapshot.id,
            selectedOutcome: input.selectedOutcome,
            slotType,
            probabilityAtPrediction:
              selectedOutcomeValues.probabilityAtPrediction as Prisma.Decimal,
            potentialPoints: selectedOutcomeValues.potentialPoints,
          },
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new DomainError(
            "PREDICTION_ALREADY_EXISTS",
            "Prediction already exists.",
            {
              userId: input.userId,
              fixtureId: fixture.id,
            },
          );
        }

        throw error;
      }

      await tx.dailyPredictionUsage.update({
        where: { id: usage.id },
        data:
          slotType === "FREE"
            ? { freeUsed: { increment: 1 } }
            : { rewardedUsed: { increment: 1 } },
      });

      await tx.tournamentParticipant.update({
        where: {
          tournamentId_userId: {
            tournamentId: tournament.id,
            userId: input.userId,
          },
        },
        data: {
          predictionsCount: { increment: 1 },
        },
      });

      if (adReward) {
        await tx.adReward.update({
          where: { id: adReward.id },
          data: {
            status: "CONSUMED",
            consumedAt: now,
            consumedByPredictionId: prediction.id,
          },
        });
      }

      const result = toPredictionMutationResult(prediction);

      await tx.idempotencyRecord.update({
        where: { id: idempotency.id },
        data: {
          responseStatus: 201,
          responseBody: result as unknown as Prisma.InputJsonValue,
        },
      });

      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}

export async function updatePrediction(
  dependencies: PredictionServiceDependencies,
  input: UpdatePredictionInput,
): Promise<PredictionMutationResult> {
  const now = dependencies.clock.now();

  return dependencies.prisma.$transaction(async (tx) => {
    const existingPrediction = await lockPredictionForUpdate(
      tx,
      input.predictionId,
      input.userId,
    );

    if (!existingPrediction) {
      throw new DomainError("PREDICTION_NOT_FOUND", "Prediction not found.", {
        predictionId: input.predictionId,
      });
    }

    if (now.getTime() >= existingPrediction.kickoffAt.getTime()) {
      throw new DomainError("PREDICTION_LOCKED", "Prediction is locked.", {
        predictionId: existingPrediction.id,
        kickoffAt: existingPrediction.kickoffAt.toISOString(),
        instant: now.toISOString(),
      });
    }

    const snapshot = await tx.outcomeSnapshot.findUniqueOrThrow({
      where: { id: existingPrediction.outcomeSnapshotId },
    });
    const selectedOutcomeValues = getSnapshotValuesForOutcome(
      snapshot,
      input.selectedOutcome,
    );

    const updatedPrediction = await tx.prediction.update({
      where: { id: existingPrediction.id },
      data: {
        selectedOutcome: input.selectedOutcome,
        probabilityAtPrediction:
          selectedOutcomeValues.probabilityAtPrediction as Prisma.Decimal,
        potentialPoints: selectedOutcomeValues.potentialPoints,
      },
    });

    return toPredictionMutationResult(updatedPrediction);
  });
}

export async function cancelPrediction(
  dependencies: PredictionServiceDependencies,
  input: CancelPredictionInput,
): Promise<CancelPredictionResult> {
  const now = dependencies.clock.now();

  return dependencies.prisma.$transaction(async (tx) => {
    const existingPrediction = await lockPredictionForUpdate(
      tx,
      input.predictionId,
      input.userId,
    );

    if (!existingPrediction) {
      throw new DomainError("PREDICTION_NOT_FOUND", "Prediction not found.", {
        predictionId: input.predictionId,
      });
    }

    if (now.getTime() >= existingPrediction.kickoffAt.getTime()) {
      throw new DomainError("PREDICTION_LOCKED", "Prediction is locked.", {
        predictionId: existingPrediction.id,
        kickoffAt: existingPrediction.kickoffAt.toISOString(),
        instant: now.toISOString(),
      });
    }

    const businessDate = getUtcDateKey(existingPrediction.kickoffAt);

    await lockDailyUsageScope(tx, input.userId, businessDate);
    await tx.adReward.updateMany({
      where: { consumedByPredictionId: existingPrediction.id },
      data: { consumedByPredictionId: null },
    });
    await tx.prediction.delete({
      where: { id: existingPrediction.id },
    });
    await reconcileDailyPredictionUsage(tx, {
      userId: input.userId,
      businessDate,
    });
    await tx.tournamentParticipant.updateMany({
      where: {
        tournamentId: existingPrediction.tournamentId,
        userId: input.userId,
        predictionsCount: { gt: 0 },
      },
      data: {
        predictionsCount: { decrement: 1 },
      },
    });

    return {
      predictionId: existingPrediction.id,
      userId: input.userId,
      tournamentId: existingPrediction.tournamentId,
      fixtureId: existingPrediction.fixtureId,
      slotType: existingPrediction.slotType,
    };
  });
}

async function lockCreatePredictionIdempotencyRecord(
  tx: Prisma.TransactionClient,
  input: CreatePredictionInput,
  requestHash: string,
) {
  await tx.$executeRaw`
    INSERT INTO "IdempotencyRecord" ("id", "userId", "operation", "key", "requestHash", "createdAt")
    VALUES (gen_random_uuid(), ${input.userId}::uuid, ${CREATE_PREDICTION_OPERATION}, ${input.idempotencyKey}, ${requestHash}, CURRENT_TIMESTAMP)
    ON CONFLICT ("userId", "operation", "key") DO NOTHING
  `;

  const [record] = await tx.$queryRaw<
    Array<{
      id: string;
      requestHash: string | null;
      responseBody: Prisma.JsonValue | null;
    }>
  >`
    SELECT id, "requestHash", "responseBody"
    FROM "IdempotencyRecord"
    WHERE "userId" = ${input.userId}::uuid
      AND operation = ${CREATE_PREDICTION_OPERATION}
      AND key = ${input.idempotencyKey}
    FOR UPDATE
  `;

  if (!record) {
    throw new Error("Failed to create idempotency record.");
  }

  if (record.requestHash !== requestHash) {
    throw new DomainError(
      "IDEMPOTENCY_CONFLICT",
      "Idempotency key was used with a different payload.",
      {
        idempotencyKey: input.idempotencyKey,
      },
    );
  }

  return record;
}

async function lockCreatePredictionIdempotencyScope(
  tx: Prisma.TransactionClient,
  input: CreatePredictionInput,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`idempotency:${input.userId}:${CREATE_PREDICTION_OPERATION}:${input.idempotencyKey}`}, 0))
  `;
}

async function lockFixture(
  tx: Prisma.TransactionClient,
  fixtureId: string,
): Promise<LockedFixtureRow | null> {
  const rows = await tx.$queryRaw<LockedFixtureRow[]>`
    SELECT
      f.id AS "id",
      f.status AS "status",
      f."kickoffAt" AS "kickoffAt",
      f."scoringSnapshotId" AS "scoringSnapshotId",
      c.code AS "competitionCode",
      c."isActive" AS "competitionIsActive"
    FROM "Fixture" f
    INNER JOIN "Competition" c ON c.id = f."competitionId"
    WHERE f.id = ${fixtureId}::uuid
    FOR UPDATE OF f
  `;

  return rows[0] ?? null;
}

async function lockPredictionForUpdate(
  tx: Prisma.TransactionClient,
  predictionId: string,
  userId: string,
): Promise<LockedPredictionRow | null> {
  const rows = await tx.$queryRaw<LockedPredictionRow[]>`
    SELECT
      p.id AS "id",
      p."userId" AS "userId",
      p."tournamentId" AS "tournamentId",
      p."fixtureId" AS "fixtureId",
      p."outcomeSnapshotId" AS "outcomeSnapshotId",
      p."slotType" AS "slotType",
      f."kickoffAt" AS "kickoffAt"
    FROM "Prediction" p
    INNER JOIN "Fixture" f ON f.id = p."fixtureId"
    WHERE p.id = ${predictionId}::uuid
      AND p."userId" = ${userId}::uuid
    FOR UPDATE OF p, f
  `;

  return rows[0] ?? null;
}

async function lockDailyUsageScope(
  tx: Prisma.TransactionClient,
  userId: string,
  businessDate: string,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`daily-prediction-usage:${userId}:${businessDate}`}, 0))
  `;
}

async function lockAndValidateAdReward(
  tx: Prisma.TransactionClient,
  input: CreatePredictionInput,
  now: Date,
): Promise<LockedAdRewardRow> {
  if (!input.adRewardId) {
    throw new DomainError("REWARDED_AD_REQUIRED", "Rewarded ad is required.");
  }

  const rows = await tx.$queryRaw<LockedAdRewardRow[]>`
    SELECT id, "userId", status, "consumedByPredictionId", "expiresAt"
    FROM "AdReward"
    WHERE id = ${input.adRewardId}::uuid
    FOR UPDATE
  `;
  const reward = rows[0];

  if (!reward) {
    throw new DomainError("INVALID_AD_REWARD", "Ad reward is invalid.", {
      adRewardId: input.adRewardId,
    });
  }

  if (reward.userId !== input.userId) {
    throw new DomainError(
      "INVALID_AD_REWARD",
      "Ad reward belongs to another user.",
      {
        adRewardId: reward.id,
      },
    );
  }

  if (reward.status === "CONSUMED" || reward.consumedByPredictionId) {
    throw new DomainError(
      "AD_REWARD_ALREADY_CONSUMED",
      "Ad reward is already consumed.",
      {
        adRewardId: reward.id,
      },
    );
  }

  if (reward.status !== "VERIFIED") {
    throw new DomainError("INVALID_AD_REWARD", "Ad reward is not verified.", {
      adRewardId: reward.id,
      status: reward.status,
    });
  }

  if (reward.expiresAt && reward.expiresAt.getTime() <= now.getTime()) {
    throw new DomainError("INVALID_AD_REWARD", "Ad reward is expired.", {
      adRewardId: reward.id,
      expiresAt: reward.expiresAt.toISOString(),
    });
  }

  return reward;
}

async function reconcileDailyPredictionUsage(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    businessDate: UtcDateKey;
  },
): Promise<void> {
  const { startUtc, endUtc } = getUtcDayRange(input.businessDate);
  const totalUsed = await tx.prediction.count({
    where: {
      userId: input.userId,
      fixture: {
        kickoffAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
    },
  });

  await tx.dailyPredictionUsage.updateMany({
    where: {
      userId: input.userId,
      businessDate: utcDateKeyToDatabaseDate(input.businessDate),
    },
    data: {
      freeUsed: Math.min(totalUsed, FREE_PREDICTION_LIMIT),
      rewardedUsed: Math.max(0, totalUsed - FREE_PREDICTION_LIMIT),
    },
  });
}

function toPredictionMutationResult(
  prediction: Prediction,
): PredictionMutationResult {
  return {
    predictionId: prediction.id,
    userId: prediction.userId,
    tournamentId: prediction.tournamentId,
    fixtureId: prediction.fixtureId,
    outcomeSnapshotId: prediction.outcomeSnapshotId,
    selectedOutcome: prediction.selectedOutcome,
    slotType: prediction.slotType,
    probabilityAtPrediction: prediction.probabilityAtPrediction.toString(),
    potentialPoints: prediction.potentialPoints,
  };
}

function hashCreatePredictionInput(input: CreatePredictionInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        userId: input.userId,
        fixtureId: input.fixtureId,
        selectedOutcome: input.selectedOutcome,
        adRewardId: input.adRewardId ?? null,
      }),
    )
    .digest("hex");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function assertFixtureIsEligibleForPredictionCreation(
  fixture: LockedFixtureRow,
  now: Date,
): void {
  try {
    assertFixtureEligibleForPrediction(
      {
        id: fixture.id,
        status: fixture.status,
        kickoffAt: fixture.kickoffAt,
        scoringSnapshotId: fixture.scoringSnapshotId,
        competition: {
          code: fixture.competitionCode,
          isActive: fixture.competitionIsActive,
        },
      },
      now,
    );
  } catch (error) {
    if (error instanceof DomainError && error.code === "FIXTURE_LOCKED") {
      throw new DomainError("PREDICTION_LOCKED", "Prediction is locked.", {
        fixtureId: fixture.id,
        kickoffAt: fixture.kickoffAt.toISOString(),
        instant: now.toISOString(),
      });
    }

    throw error;
  }
}
