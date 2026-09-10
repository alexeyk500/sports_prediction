import { randomUUID } from "node:crypto";
import {
  Prisma,
  type PredictionOutcome,
  type PrismaClient,
} from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  businessDateToDatabaseDate,
  getBusinessDate,
  type BusinessDate,
} from "@/lib/time/business-time";
import type { Clock } from "@/lib/time/clock";
import { assertFixtureEligibleForPrediction } from "@/modules/fixtures/fixture.domain";
import {
  DAILY_PREDICTION_LIMIT,
  FREE_PREDICTION_LIMIT,
  REWARDED_PREDICTION_LIMIT,
} from "@/modules/predictions/prediction.domain";

export const MONETAG_PROVIDER = "MONETAG";
export const MONETAG_EXTRA_PREDICTION_PLACEMENT = "MATCHES_EXTRA_PREDICTION";
export const MONETAG_EXTRA_PREDICTION_REQUEST_VAR = "matches_extra_prediction";

const SESSION_TTL_MS = 15 * 60 * 1000;

export interface MonetagRewardDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export interface CreateMonetagRewardSessionInput {
  userId: string;
  fixtureId: string;
  selectedOutcome: PredictionOutcome;
}

export interface MonetagRewardSessionDto {
  adRewardId: string;
  ymid: string;
  zoneId: string;
  requestVar: typeof MONETAG_EXTRA_PREDICTION_REQUEST_VAR;
  status: "CREATED" | "VERIFIED" | "CONSUMED" | "EXPIRED" | "REJECTED";
  expiresAt: string;
}

export async function createMonetagRewardSession(
  dependencies: MonetagRewardDependencies,
  input: CreateMonetagRewardSessionInput,
): Promise<MonetagRewardSessionDto> {
  const now = dependencies.clock.now();
  const zoneId = requireMonetagZoneId();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const businessDate = getBusinessDate(now);

  return dependencies.prisma.$transaction(async (tx) => {
    await lockMonetagRewardSessionScope(tx, input.userId);
    await expireCreatedSessions(tx, now);
    await assertUserEligibleForRewardSession(tx, input, now, businessDate);

    const existingVerified = await tx.adReward.findFirst({
      where: {
        userId: input.userId,
        provider: MONETAG_PROVIDER,
        placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
        status: "VERIFIED",
        consumedByPredictionId: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "asc" },
    });

    if (existingVerified?.ymid) {
      return toSessionDto(existingVerified, zoneId);
    }

    await tx.adReward.updateMany({
      where: {
        userId: input.userId,
        provider: MONETAG_PROVIDER,
        placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
        status: "CREATED",
        expiresAt: { gt: now },
      },
      data: {
        status: "REJECTED",
        rejectedAt: now,
      },
    });

    const ymid = randomUUID();
    const session = await tx.adReward.create({
      data: {
        userId: input.userId,
        provider: MONETAG_PROVIDER,
        providerRewardId: ymid,
        placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
        attemptKey: `monetag:${ymid}`,
        ymid,
        zoneId,
        requestVar: MONETAG_EXTRA_PREDICTION_REQUEST_VAR,
        status: "CREATED",
        expiresAt,
        metadata: {
          fixtureId: input.fixtureId,
          selectedOutcome: input.selectedOutcome,
        },
      },
    });

    console.info("monetag_reward_session_created", {
      adRewardId: session.id,
      placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
    });

    return toSessionDto(session, zoneId);
  });
}

export async function confirmMonetagRewardSession(
  dependencies: MonetagRewardDependencies,
  input: { userId: string; adRewardId: string },
): Promise<MonetagRewardSessionDto> {
  const now = dependencies.clock.now();
  const zoneId = requireMonetagZoneId();

  const result = await dependencies.prisma.$transaction(async (tx) => {
    const session = await lockMonetagRewardSession(tx, input.adRewardId);

    if (!session?.ymid) {
      throw new DomainError("INVALID_AD_REWARD", "Ad reward is invalid.", {
        adRewardId: input.adRewardId,
      });
    }

    if (
      session.userId !== input.userId ||
      session.provider !== MONETAG_PROVIDER ||
      session.placement !== MONETAG_EXTRA_PREDICTION_PLACEMENT
    ) {
      throw new DomainError("INVALID_AD_REWARD", "Ad reward is invalid.", {
        adRewardId: input.adRewardId,
      });
    }

    if (session.status === "VERIFIED") {
      return { session: toSessionDto(session, zoneId) };
    }

    if (session.status === "CONSUMED" || session.consumedByPredictionId) {
      throw new DomainError(
        "AD_REWARD_ALREADY_CONSUMED",
        "Ad reward is already consumed.",
        { adRewardId: session.id },
      );
    }

    if (session.status !== "CREATED") {
      throw new DomainError(
        "INVALID_AD_REWARD",
        "Ad reward is not confirmable.",
        {
          adRewardId: session.id,
          status: session.status,
        },
      );
    }

    if (session.expiresAt && session.expiresAt.getTime() <= now.getTime()) {
      const expiredSession = await tx.adReward.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });

      return {
        error: new DomainError("INVALID_AD_REWARD", "Ad reward is expired.", {
          adRewardId: expiredSession.id,
          expiresAt: session.expiresAt.toISOString(),
        }),
      };
    }

    const confirmedSession = await tx.adReward.update({
      where: { id: session.id },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
        metadata: {
          ...metadataObject(session.metadata),
          confirmedBy: "sdk_promise",
          confirmedAt: now.toISOString(),
        },
      },
    });

    console.info("monetag_reward_grant_created", {
      adRewardId: confirmedSession.id,
      authority: "sdk_promise_confirm",
    });

    return { session: toSessionDto(confirmedSession, zoneId) };
  });

  if ("error" in result) {
    throw result.error;
  }

  return result.session;
}

export async function getMonetagRewardSession(
  dependencies: MonetagRewardDependencies,
  input: { userId: string; adRewardId: string },
): Promise<MonetagRewardSessionDto> {
  const now = dependencies.clock.now();
  const zoneId = requireMonetagZoneId();

  return dependencies.prisma.$transaction(async (tx) => {
    await expireCreatedSessions(tx, now);
    const session = await tx.adReward.findFirst({
      where: {
        id: input.adRewardId,
        userId: input.userId,
        provider: MONETAG_PROVIDER,
        placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
      },
    });

    if (!session?.ymid) {
      throw new DomainError("INVALID_AD_REWARD", "Ad reward is invalid.", {
        adRewardId: input.adRewardId,
      });
    }

    return toSessionDto(session, zoneId);
  });
}

function requireMonetagZoneId(): string {
  const zoneId = process.env.MONETAG_REWARDED_INTERSTITIAL_ZONE_ID;

  if (!zoneId || !/^\d+$/.test(zoneId)) {
    throw new Error("MONETAG_REWARDED_INTERSTITIAL_ZONE_ID is not configured.");
  }

  return zoneId;
}

async function lockMonetagRewardSessionScope(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`monetag-reward-session:${userId}:${MONETAG_EXTRA_PREDICTION_PLACEMENT}`}, 0))
  `;
}

async function lockMonetagRewardSession(
  tx: Prisma.TransactionClient,
  adRewardId: string,
): Promise<LockedMonetagRewardSession | null> {
  const rows = await tx.$queryRaw<LockedMonetagRewardSession[]>`
    SELECT id, "userId", provider, placement, ymid, "zoneId", "requestVar",
           status, "expiresAt", "consumedByPredictionId", metadata
    FROM "AdReward"
    WHERE id = ${adRewardId}::uuid
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

async function assertUserEligibleForRewardSession(
  tx: Prisma.TransactionClient,
  input: CreateMonetagRewardSessionInput,
  now: Date,
  businessDate: BusinessDate,
): Promise<void> {
  const usage = await tx.dailyPredictionUsage.findUnique({
    where: {
      userId_businessDate: {
        userId: input.userId,
        businessDate: businessDateToDatabaseDate(businessDate),
      },
    },
  });
  const freeUsed = usage?.freeUsed ?? 0;
  const rewardedUsed = usage?.rewardedUsed ?? 0;
  const totalUsed = freeUsed + rewardedUsed;

  if (freeUsed < FREE_PREDICTION_LIMIT) {
    throw new DomainError(
      "AD_REWARD_NOT_ELIGIBLE",
      "Free prediction quota is still available.",
    );
  }

  if (
    rewardedUsed >= REWARDED_PREDICTION_LIMIT ||
    totalUsed >= DAILY_PREDICTION_LIMIT
  ) {
    throw new DomainError(
      "DAILY_PREDICTION_LIMIT_REACHED",
      "Daily prediction limit reached.",
      { freeUsed, rewardedUsed },
    );
  }

  const fixture = await tx.fixture.findUnique({
    where: { id: input.fixtureId },
    include: { competition: true },
  });

  if (!fixture) {
    throw new DomainError("FIXTURE_NOT_FOUND", "Fixture not found.", {
      fixtureId: input.fixtureId,
    });
  }

  if (getBusinessDate(fixture.kickoffAt) !== businessDate) {
    throw new DomainError(
      "FIXTURE_NOT_IN_DAILY_POOL",
      "Fixture is not in the current daily match pool.",
      {
        fixtureId: fixture.id,
        businessDate,
        fixtureBusinessDate: getBusinessDate(fixture.kickoffAt),
      },
    );
  }

  assertFixtureEligibleForPrediction(fixture, now);

  const existingPrediction = await tx.prediction.findUnique({
    where: {
      userId_fixtureId: {
        userId: input.userId,
        fixtureId: input.fixtureId,
      },
    },
  });

  if (existingPrediction) {
    throw new DomainError(
      "PREDICTION_ALREADY_EXISTS",
      "Prediction already exists.",
      { fixtureId: input.fixtureId },
    );
  }
}

async function expireCreatedSessions(
  tx: Prisma.TransactionClient,
  now: Date,
): Promise<void> {
  await tx.adReward.updateMany({
    where: {
      provider: MONETAG_PROVIDER,
      placement: MONETAG_EXTRA_PREDICTION_PLACEMENT,
      status: "CREATED",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });
}

function metadataObject(
  value: Prisma.JsonValue,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function toSessionDto(
  reward: {
    id: string;
    ymid: string | null;
    zoneId: string | null;
    requestVar: string | null;
    status: "CREATED" | "VERIFIED" | "CONSUMED" | "EXPIRED" | "REJECTED";
    expiresAt: Date | null;
  },
  configuredZoneId: string,
): MonetagRewardSessionDto {
  if (!reward.ymid) {
    throw new Error("Monetag reward session is missing ymid.");
  }

  return {
    adRewardId: reward.id,
    ymid: reward.ymid,
    zoneId: reward.zoneId ?? configuredZoneId,
    requestVar: MONETAG_EXTRA_PREDICTION_REQUEST_VAR,
    status: reward.status,
    expiresAt: (reward.expiresAt ?? new Date(0)).toISOString(),
  };
}

interface LockedMonetagRewardSession {
  id: string;
  userId: string;
  provider: string;
  placement: string | null;
  ymid: string | null;
  zoneId: string | null;
  requestVar: string | null;
  status: "CREATED" | "VERIFIED" | "CONSUMED" | "EXPIRED" | "REJECTED";
  expiresAt: Date | null;
  consumedByPredictionId: string | null;
  metadata: Prisma.JsonValue;
}
