import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { createPrediction } from "@/modules/predictions/prediction.service";
import { createTestPrismaClient } from "../../integration/helpers/prisma-test-client";
import {
  createActiveTestTournament,
  createEligibleTestFixture,
  createTestAdReward,
  createTestUser,
  uniqueTestKey,
} from "../../integration/helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-05T12:00:00.000Z");

describe("prediction creation concurrency", () => {
  beforeAll(async () => {
    await createActiveTestTournament(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allows exactly one of simultaneous 8th and 9th prediction attempts", async () => {
    const user = await createTestUser(prisma);
    await createPredictions(user.id, 3, "FREE");
    await createPredictions(user.id, 4, "REWARDED");

    const firstReward = await createTestAdReward(prisma, user.id);
    const secondReward = await createTestAdReward(prisma, user.id);
    const firstFixture = await createEligibleTestFixture(prisma);
    const secondFixture = await createEligibleTestFixture(prisma);
    const results = await Promise.allSettled([
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: firstFixture.fixture.id,
          selectedOutcome: "HOME",
          adRewardId: firstReward.id,
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: secondFixture.fixture.id,
          selectedOutcome: "DRAW",
          adRewardId: secondReward.id,
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
    ]);
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({
      where: { userId: user.id },
    });

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(usage.freeUsed).toBe(3);
    expect(usage.rewardedUsed).toBe(5);
    expect(await prisma.prediction.count({ where: { userId: user.id } })).toBe(
      8,
    );
  });

  it("consumes the same AdReward only once", async () => {
    const user = await createTestUser(prisma);
    await createPredictions(user.id, 3, "FREE");

    const reward = await createTestAdReward(prisma, user.id);
    const firstFixture = await createEligibleTestFixture(prisma);
    const secondFixture = await createEligibleTestFixture(prisma);
    const results = await Promise.allSettled([
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: firstFixture.fixture.id,
          selectedOutcome: "HOME",
          adRewardId: reward.id,
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: secondFixture.fixture.id,
          selectedOutcome: "DRAW",
          adRewardId: reward.id,
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
    ]);
    const consumedReward = await prisma.adReward.findUniqueOrThrow({
      where: { id: reward.id },
    });

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(consumedReward.status).toBe("CONSUMED");
    expect(consumedReward.consumedByPredictionId).not.toBeNull();
    expect(await prisma.prediction.count({ where: { userId: user.id } })).toBe(
      4,
    );
  });

  it("auto-joins tournament once for simultaneous first predictions", async () => {
    const user = await createTestUser(prisma);
    const firstFixture = await createEligibleTestFixture(prisma);
    const secondFixture = await createEligibleTestFixture(prisma);
    const results = await Promise.allSettled([
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: firstFixture.fixture.id,
          selectedOutcome: "HOME",
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: secondFixture.fixture.id,
          selectedOutcome: "DRAW",
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
    ]);
    const participants = await prisma.tournamentParticipant.findMany({
      where: { userId: user.id },
    });

    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect(participants).toHaveLength(1);
    expect(participants[0]?.predictionsCount).toBe(2);
  });

  it("creates exactly one prediction for concurrent same-fixture attempts", async () => {
    const user = await createTestUser(prisma);
    const { fixture } = await createEligibleTestFixture(prisma);
    const results = await Promise.allSettled([
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: fixture.id,
          selectedOutcome: "HOME",
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: fixture.id,
          selectedOutcome: "DRAW",
          idempotencyKey: uniqueTestKey("idem"),
        },
      ),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(
      await prisma.prediction.count({
        where: { userId: user.id, fixtureId: fixture.id },
      }),
    ).toBe(1);
  });

  it("serializes a new idempotency key for simultaneous identical rewarded requests", async () => {
    const user = await createTestUser(prisma);
    await createPredictions(user.id, 3, "FREE");

    const reward = await createTestAdReward(prisma, user.id);
    const { fixture } = await createEligibleTestFixture(prisma);
    const idempotencyKey = uniqueTestKey("idem");
    const input = {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME" as const,
      adRewardId: reward.id,
      idempotencyKey,
    };

    const results = await Promise.allSettled([
      createPrediction({ prisma, clock }, input),
      createPrediction({ prisma, clock }, input),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({
      where: { userId: user.id },
    });
    const participant = await prisma.tournamentParticipant.findFirstOrThrow({
      where: { userId: user.id },
    });
    const consumedReward = await prisma.adReward.findUniqueOrThrow({
      where: { id: reward.id },
    });

    expect(fulfilled).toHaveLength(2);
    expect(
      fulfilled[0]?.status === "fulfilled" ? fulfilled[0].value : null,
    ).toEqual(fulfilled[1]?.status === "fulfilled" ? fulfilled[1].value : null);
    expect(
      await prisma.prediction.count({
        where: { userId: user.id, fixtureId: fixture.id },
      }),
    ).toBe(1);
    expect(usage.freeUsed).toBe(3);
    expect(usage.rewardedUsed).toBe(1);
    expect(participant.predictionsCount).toBe(4);
    expect(consumedReward.status).toBe("CONSUMED");
    expect(consumedReward.consumedByPredictionId).toBe(
      fulfilled[0]?.status === "fulfilled"
        ? fulfilled[0].value.predictionId
        : null,
    );
    expect(
      await prisma.idempotencyRecord.count({
        where: { userId: user.id, key: idempotencyKey },
      }),
    ).toBe(1);
  });

  it("serializes a new idempotency key for simultaneous conflicting payloads", async () => {
    const user = await createTestUser(prisma);
    const firstFixture = await createEligibleTestFixture(prisma);
    const secondFixture = await createEligibleTestFixture(prisma);
    const idempotencyKey = uniqueTestKey("idem");

    const results = await Promise.allSettled([
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: firstFixture.fixture.id,
          selectedOutcome: "HOME",
          idempotencyKey,
        },
      ),
      createPrediction(
        { prisma, clock },
        {
          userId: user.id,
          fixtureId: secondFixture.fixture.id,
          selectedOutcome: "DRAW",
          idempotencyKey,
        },
      ),
    ]);
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({
      where: { userId: user.id },
    });
    const participant = await prisma.tournamentParticipant.findFirstOrThrow({
      where: { userId: user.id },
    });

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({
      reason: { code: "IDEMPOTENCY_CONFLICT" },
    });
    expect(await prisma.prediction.count({ where: { userId: user.id } })).toBe(
      1,
    );
    expect(usage.freeUsed).toBe(1);
    expect(usage.rewardedUsed).toBe(0);
    expect(participant.predictionsCount).toBe(1);
    expect(
      await prisma.idempotencyRecord.count({
        where: { userId: user.id, key: idempotencyKey },
      }),
    ).toBe(1);
  });
});

async function createPredictions(
  userId: string,
  count: number,
  slotType: "FREE" | "REWARDED",
): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const { fixture } = await createEligibleTestFixture(prisma);
    const reward =
      slotType === "REWARDED" ? await createTestAdReward(prisma, userId) : null;

    await createPrediction(
      { prisma, clock },
      {
        userId,
        fixtureId: fixture.id,
        selectedOutcome: "HOME",
        adRewardId: reward?.id,
        idempotencyKey: uniqueTestKey("idem"),
      },
    );
  }
}
