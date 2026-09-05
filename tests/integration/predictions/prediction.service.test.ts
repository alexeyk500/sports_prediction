import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { createPrediction, updatePrediction } from "@/modules/predictions/prediction.service";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import {
  attachTestScoringSnapshot,
  createActiveTestTournament,
  createEligibleTestFixture,
  createSupportedTestCompetition,
  createTestAdReward,
  createTestFixture,
  createTestUser,
  uniqueTestKey,
} from "../helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-05T12:00:00.000Z");

describe("prediction service", () => {
  beforeAll(async () => {
    await createActiveTestTournament(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates first free prediction and auto-joins tournament", async () => {
    const user = await createTestUser(prisma);
    const { fixture, snapshot } = await createEligibleTestFixture(prisma);

    const result = await createPrediction(
      { prisma, clock },
      {
        userId: user.id,
        fixtureId: fixture.id,
        selectedOutcome: "HOME",
        idempotencyKey: uniqueTestKey("idem"),
      },
    );

    const usage = await prisma.dailyPredictionUsage.findUniqueOrThrow({
      where: {
        userId_businessDate: {
          userId: user.id,
          businessDate: new Date("2026-09-05T00:00:00.000Z"),
        },
      },
    });
    const participant = await prisma.tournamentParticipant.findFirstOrThrow({
      where: { userId: user.id },
    });
    const prediction = await prisma.prediction.findUniqueOrThrow({
      where: { id: result.predictionId },
    });

    expect(result).toMatchObject({
      userId: user.id,
      fixtureId: fixture.id,
      outcomeSnapshotId: snapshot.id,
      slotType: "FREE",
      selectedOutcome: "HOME",
      probabilityAtPrediction: "0.48275862",
      potentialPoints: 13,
    });
    expect(usage.freeUsed).toBe(1);
    expect(usage.rewardedUsed).toBe(0);
    expect(participant.predictionsCount).toBe(1);
    expect(prediction.tournamentId).toBe(participant.tournamentId);
  });

  it("creates the third free prediction without consuming a supplied reward", async () => {
    const user = await createTestUser(prisma);

    for (let index = 0; index < 2; index += 1) {
      const { fixture } = await createEligibleTestFixture(prisma);
      await createPrediction({ prisma, clock }, {
        userId: user.id,
        fixtureId: fixture.id,
        selectedOutcome: "HOME",
        idempotencyKey: uniqueTestKey("idem"),
      });
    }

    const reward = await createTestAdReward(prisma, user.id);
    const { fixture } = await createEligibleTestFixture(prisma);
    const third = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "DRAW",
      adRewardId: reward.id,
      idempotencyKey: uniqueTestKey("idem"),
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({ where: { userId: user.id } });
    const unchangedReward = await prisma.adReward.findUniqueOrThrow({ where: { id: reward.id } });

    expect(third.slotType).toBe("FREE");
    expect(usage.freeUsed).toBe(3);
    expect(usage.rewardedUsed).toBe(0);
    expect(unchangedReward.status).toBe("VERIFIED");
    expect(unchangedReward.consumedByPredictionId).toBeNull();
  });

  it("rejects fourth prediction without AdReward and succeeds with a valid reward", async () => {
    const user = await createTestUser(prisma);

    await createFreePredictions(user.id, 3);

    const rejectedFixture = await createEligibleTestFixture(prisma);
    await expect(
      createPrediction({ prisma, clock }, {
        userId: user.id,
        fixtureId: rejectedFixture.fixture.id,
        selectedOutcome: "AWAY",
        idempotencyKey: uniqueTestKey("idem"),
      }),
    ).rejects.toMatchObject({ code: "REWARDED_AD_REQUIRED" });

    const reward = await createTestAdReward(prisma, user.id);
    const acceptedFixture = await createEligibleTestFixture(prisma);
    const result = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: acceptedFixture.fixture.id,
      selectedOutcome: "AWAY",
      adRewardId: reward.id,
      idempotencyKey: uniqueTestKey("idem"),
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({ where: { userId: user.id } });
    const consumedReward = await prisma.adReward.findUniqueOrThrow({ where: { id: reward.id } });

    expect(result.slotType).toBe("REWARDED");
    expect(usage.freeUsed).toBe(3);
    expect(usage.rewardedUsed).toBe(1);
    expect(consumedReward.status).toBe("CONSUMED");
    expect(consumedReward.consumedByPredictionId).toBe(result.predictionId);
  });

  it("allows 8 total predictions and rejects the 9th", async () => {
    const user = await createTestUser(prisma);

    await createFreePredictions(user.id, 3);

    for (let index = 0; index < 5; index += 1) {
      const reward = await createTestAdReward(prisma, user.id);
      const { fixture } = await createEligibleTestFixture(prisma);
      await createPrediction({ prisma, clock }, {
        userId: user.id,
        fixtureId: fixture.id,
        selectedOutcome: "HOME",
        adRewardId: reward.id,
        idempotencyKey: uniqueTestKey("idem"),
      });
    }

    const extraReward = await createTestAdReward(prisma, user.id);
    const extraFixture = await createEligibleTestFixture(prisma);
    await expect(
      createPrediction({ prisma, clock }, {
        userId: user.id,
        fixtureId: extraFixture.fixture.id,
        selectedOutcome: "HOME",
        adRewardId: extraReward.id,
        idempotencyKey: uniqueTestKey("idem"),
      }),
    ).rejects.toMatchObject({ code: "DAILY_PREDICTION_LIMIT_REACHED" });
  });

  it("rejects invalid AdReward states", async () => {
    const user = await createTestUser(prisma);
    const otherUser = await createTestUser(prisma);

    await createFreePredictions(user.id, 3);

    const expired = await createTestAdReward(prisma, user.id, {
      expiresAt: new Date("2026-09-05T11:59:59.000Z"),
    });
    const otherUsersReward = await createTestAdReward(prisma, otherUser.id);

    await expectRewardRejected(user.id, expired.id, "INVALID_AD_REWARD");
    await expectRewardRejected(user.id, otherUsersReward.id, "INVALID_AD_REWARD");
  });

  it("rejects already consumed AdReward", async () => {
    const user = await createTestUser(prisma);
    await createFreePredictions(user.id, 3);

    const reward = await createTestAdReward(prisma, user.id);
    const { fixture } = await createEligibleTestFixture(prisma);
    await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      adRewardId: reward.id,
      idempotencyKey: uniqueTestKey("idem"),
    });

    await createFreePredictions(user.id, 0);
    await expectRewardRejected(user.id, reward.id, "AD_REWARD_ALREADY_CONSUMED");
  });

  it("maps duplicate fixture prediction to typed error", async () => {
    const user = await createTestUser(prisma);
    const { fixture } = await createEligibleTestFixture(prisma);

    await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });

    await expect(
      createPrediction({ prisma, clock }, {
        userId: user.id,
        fixtureId: fixture.id,
        selectedOutcome: "DRAW",
        idempotencyKey: uniqueTestKey("idem"),
      }),
    ).rejects.toMatchObject({ code: "PREDICTION_ALREADY_EXISTS" });
  });

  it("returns same result for idempotent retry and rejects conflicting payload", async () => {
    const user = await createTestUser(prisma);
    const { fixture } = await createEligibleTestFixture(prisma);
    const idempotencyKey = uniqueTestKey("idem");
    const input = {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME" as const,
      idempotencyKey,
    };

    const first = await createPrediction({ prisma, clock }, input);
    const second = await createPrediction({ prisma, clock }, input);

    expect(second).toEqual(first);
    expect(await prisma.prediction.count({ where: { userId: user.id, fixtureId: fixture.id } })).toBe(1);

    const { fixture: otherFixture } = await createEligibleTestFixture(prisma);
    await expect(
      createPrediction({ prisma, clock }, {
        ...input,
        fixtureId: otherFixture.id,
      }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("updates selected outcome before kickoff without quota or slot changes", async () => {
    const user = await createTestUser(prisma);
    const { fixture, snapshot } = await createEligibleTestFixture(prisma);
    const created = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });

    const updated = await updatePrediction({ prisma, clock }, {
      userId: user.id,
      predictionId: created.predictionId,
      selectedOutcome: "AWAY",
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({ where: { userId: user.id } });
    const participant = await prisma.tournamentParticipant.findFirstOrThrow({ where: { userId: user.id } });

    expect(updated.selectedOutcome).toBe("AWAY");
    expect(updated.slotType).toBe("FREE");
    expect(updated.outcomeSnapshotId).toBe(snapshot.id);
    expect(updated.probabilityAtPrediction).toBe("0.24137931");
    expect(updated.potentialPoints).toBe(27);
    expect(usage.freeUsed).toBe(1);
    expect(usage.rewardedUsed).toBe(0);
    expect(participant.predictionsCount).toBe(1);
  });

  it("updates rewarded prediction without consuming quota or AdReward again", async () => {
    const user = await createTestUser(prisma);
    await createFreePredictions(user.id, 3);

    const reward = await createTestAdReward(prisma, user.id);
    const { fixture, snapshot } = await createEligibleTestFixture(prisma);
    const created = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      adRewardId: reward.id,
      idempotencyKey: uniqueTestKey("idem"),
    });
    const consumedRewardBeforeEdit = await prisma.adReward.findUniqueOrThrow({ where: { id: reward.id } });

    const updated = await updatePrediction({ prisma, clock }, {
      userId: user.id,
      predictionId: created.predictionId,
      selectedOutcome: "DRAW",
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({ where: { userId: user.id } });
    const participant = await prisma.tournamentParticipant.findFirstOrThrow({ where: { userId: user.id } });
    const consumedRewardAfterEdit = await prisma.adReward.findUniqueOrThrow({ where: { id: reward.id } });

    expect(updated.slotType).toBe("REWARDED");
    expect(updated.outcomeSnapshotId).toBe(snapshot.id);
    expect(updated.probabilityAtPrediction).toBe("0.27586207");
    expect(updated.potentialPoints).toBe(24);
    expect(usage.freeUsed).toBe(3);
    expect(usage.rewardedUsed).toBe(1);
    expect(participant.predictionsCount).toBe(4);
    expect(consumedRewardAfterEdit).toMatchObject({
      status: consumedRewardBeforeEdit.status,
      consumedByPredictionId: created.predictionId,
      consumedAt: consumedRewardBeforeEdit.consumedAt,
    });
  });

  it("updates selected outcome immediately before kickoff", async () => {
    const user = await createTestUser(prisma);
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date("2026-09-05T12:00:00.000Z"),
    });
    await attachTestScoringSnapshot(prisma, fixture.id);

    clock.set("2026-09-05T11:59:59.998Z");
    const created = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });

    clock.set("2026-09-05T11:59:59.999Z");
    const updated = await updatePrediction({ prisma, clock }, {
      userId: user.id,
      predictionId: created.predictionId,
      selectedOutcome: "DRAW",
    });

    expect(updated.selectedOutcome).toBe("DRAW");
    expect(updated.probabilityAtPrediction).toBe("0.27586207");
    expect(updated.potentialPoints).toBe(24);

    clock.set("2026-09-05T12:00:00.000Z");
  });

  it("does not reject edit only because Fixture status changed before kickoff", async () => {
    const user = await createTestUser(prisma);
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date("2026-09-05T12:00:00.000Z"),
    });
    await attachTestScoringSnapshot(prisma, fixture.id);

    clock.set("2026-09-05T11:59:59.998Z");
    const created = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });

    await prisma.fixture.update({
      where: { id: fixture.id },
      data: { status: "LOCKED" },
    });

    clock.set("2026-09-05T11:59:59.999Z");
    const updated = await updatePrediction({ prisma, clock }, {
      userId: user.id,
      predictionId: created.predictionId,
      selectedOutcome: "AWAY",
    });

    expect(updated.selectedOutcome).toBe("AWAY");
    expect(updated.probabilityAtPrediction).toBe("0.24137931");
    expect(updated.potentialPoints).toBe(27);

    clock.set("2026-09-05T12:00:00.000Z");
  });

  it("rejects edit at and after kickoff", async () => {
    const user = await createTestUser(prisma);
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date("2026-09-05T12:00:00.000Z"),
    });
    await attachTestScoringSnapshot(prisma, fixture.id);

    clock.set("2026-09-05T11:59:59.999Z");
    const created = await createPrediction({ prisma, clock }, {
      userId: user.id,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });

    clock.set("2026-09-05T12:00:00.000Z");
    await expect(
      updatePrediction({ prisma, clock }, {
        userId: user.id,
        predictionId: created.predictionId,
        selectedOutcome: "DRAW",
      }),
    ).rejects.toMatchObject({ code: "PREDICTION_LOCKED" });

    clock.set("2026-09-05T12:00:00.001Z");
    await expect(
      updatePrediction({ prisma, clock }, {
        userId: user.id,
        predictionId: created.predictionId,
        selectedOutcome: "DRAW",
      }),
    ).rejects.toMatchObject({ code: "PREDICTION_LOCKED" });

    clock.set("2026-09-05T12:00:00.000Z");
  });
});

async function createFreePredictions(userId: string, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const { fixture } = await createEligibleTestFixture(prisma);
    await createPrediction({ prisma, clock }, {
      userId,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      idempotencyKey: uniqueTestKey("idem"),
    });
  }
}

async function expectRewardRejected(userId: string, adRewardId: string, code: string): Promise<void> {
  const { fixture } = await createEligibleTestFixture(prisma);

  await expect(
    createPrediction({ prisma, clock }, {
      userId,
      fixtureId: fixture.id,
      selectedOutcome: "HOME",
      adRewardId,
      idempotencyKey: uniqueTestKey("idem"),
    }),
  ).rejects.toMatchObject({ code });
}
