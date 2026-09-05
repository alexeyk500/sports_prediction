import { afterAll, describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { DomainError } from "@/lib/errors/domain-error";
import {
  findActiveTournamentForInstant,
  requireActiveTournamentForPrediction,
} from "@/modules/tournaments/tournament.service";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import { uniqueTournamentNumber } from "../helpers/factories";

const prisma = createTestPrismaClient();

describe("tournament service", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("finds active tournament for a given instant", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "ACTIVE",
        startsAt: new Date("2026-09-05T00:00:00.000Z"),
        endsAt: new Date("2026-09-06T00:00:00.000Z"),
        prizePoolNanoTon: 0n,
      },
    });

    await expect(
      findActiveTournamentForInstant(
        { prisma },
        new Date("2026-09-05T12:00:00.000Z"),
      ),
    ).resolves.toMatchObject({ id: tournament.id });
  });

  it("raises a domain error when no active tournament exists", async () => {
    await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "SCHEDULED",
        startsAt: new Date("2026-10-01T00:00:00.000Z"),
        endsAt: new Date("2026-10-08T00:00:00.000Z"),
        prizePoolNanoTon: 0n,
      },
    });

    await expect(
      requireActiveTournamentForPrediction({
        prisma,
        clock: new FixedClock("2030-01-01T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "NO_ACTIVE_TOURNAMENT",
    } satisfies Partial<DomainError>);
  });
});
