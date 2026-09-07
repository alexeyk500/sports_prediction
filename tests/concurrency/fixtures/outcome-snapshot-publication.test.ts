import { afterAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { publishOutcomeSnapshot } from "@/modules/fixtures/outcome-snapshot.service";
import { createTestPrismaClient } from "../../integration/helpers/prisma-test-client";
import {
  createSupportedTestCompetition,
  createTestFixture,
} from "../../integration/helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-05T12:00:00.000Z");

describe("outcome snapshot publication concurrency", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not create multiple active business effects for concurrent publish attempts", async () => {
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, {
      competitionId: competition.id,
    });

    const [first, second] = await Promise.all([
      publishOutcomeSnapshot(
        { prisma, clock },
        {
          fixtureId: fixture.id,
          odds: { home: "2.00", draw: "3.50", away: "4.00" },
        },
      ),
      publishOutcomeSnapshot(
        { prisma, clock },
        {
          fixtureId: fixture.id,
          odds: { home: "1.40", draw: "4.50", away: "7.00" },
        },
      ),
    ]);
    const snapshots = await prisma.outcomeSnapshot.findMany({
      where: { fixtureId: fixture.id },
    });
    const updatedFixture = await prisma.fixture.findUniqueOrThrow({
      where: { id: fixture.id },
    });

    expect(first.id).toBe(second.id);
    expect(snapshots).toHaveLength(1);
    expect(updatedFixture.scoringSnapshotId).toBe(first.id);
  });
});
