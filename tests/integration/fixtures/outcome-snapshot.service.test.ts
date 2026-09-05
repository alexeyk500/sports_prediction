import { afterAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { SCORING_VERSION } from "@/modules/predictions/scoring.domain";
import { publishOutcomeSnapshot } from "@/modules/fixtures/outcome-snapshot.service";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import { createSupportedTestCompetition, createTestFixture } from "../helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-05T12:00:00.000Z");

describe("outcome snapshot publication", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("publishes normalized 1X2 probabilities and points", async () => {
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, { competitionId: competition.id });

    const snapshot = await publishOutcomeSnapshot(
      { prisma, clock },
      {
        fixtureId: fixture.id,
        odds: {
          home: "2.00",
          draw: "3.50",
          away: "4.00",
        },
      },
    );
    const updatedFixture = await prisma.fixture.findUniqueOrThrow({ where: { id: fixture.id } });

    expect(snapshot.scoringVersion).toBe(SCORING_VERSION);
    expect(snapshot.snapshotAt.toISOString()).toBe("2026-09-05T12:00:00.000Z");
    expect(snapshot.homeProbability.toString()).toBe("0.48275862");
    expect(snapshot.drawProbability.toString()).toBe("0.27586207");
    expect(snapshot.awayProbability.toString()).toBe("0.24137931");
    expect(snapshot.homePoints).toBe(13);
    expect(snapshot.drawPoints).toBe(24);
    expect(snapshot.awayPoints).toBe(27);
    expect(updatedFixture.scoringSnapshotId).toBe(snapshot.id);
    expect(updatedFixture.status).toBe("OPEN");
  });

  it("does not mutate a published snapshot on later publish attempts", async () => {
    const competition = await createSupportedTestCompetition(prisma);
    const fixture = await createTestFixture(prisma, { competitionId: competition.id });

    const first = await publishOutcomeSnapshot({ prisma, clock }, {
      fixtureId: fixture.id,
      odds: { home: "2.00", draw: "3.50", away: "4.00" },
    });
    const second = await publishOutcomeSnapshot({ prisma, clock }, {
      fixtureId: fixture.id,
      odds: { home: "1.20", draw: "6.00", away: "12.00" },
    });
    const snapshots = await prisma.outcomeSnapshot.findMany({ where: { fixtureId: fixture.id } });

    expect(second.id).toBe(first.id);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.homeRawOdds.toString()).toBe("2");
  });
});
