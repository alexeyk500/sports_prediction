import { afterAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { resolveEligibleFixtureForPrediction } from "@/modules/fixtures/fixture.service";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import {
  attachTestScoringSnapshot,
  createTestCompetition,
  createTestFixture,
  createSupportedTestCompetition,
} from "../helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-05T12:00:00.000Z");

describe("fixture service", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("resolves an eligible fixture for prediction", async () => {
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
    });
    await attachTestScoringSnapshot(prisma, fixture.id);

    await expect(
      resolveEligibleFixtureForPrediction({ prisma, clock }, fixture.id),
    ).resolves.toMatchObject({
      id: fixture.id,
      status: "OPEN",
    });
  });

  it("rejects fixture without scoring snapshot", async () => {
    const competition = await createTestCompetition(prisma, { code: "EPL" });
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      status: "OPEN",
    });

    await expect(
      resolveEligibleFixtureForPrediction({ prisma, clock }, fixture.id),
    ).rejects.toMatchObject({
      code: "FIXTURE_SCORING_SNAPSHOT_MISSING",
    });
  });
});
