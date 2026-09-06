import type { FixtureStatus, PrismaClient } from "@prisma/client";
import { getBusinessDate, getBusinessDayRangeUtc } from "@/lib/time/business-time";
import type { Clock } from "@/lib/time/clock";
import { SUPPORTED_COMPETITION_CODES } from "./fixture.domain";

export interface TodayFixturesDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export interface TodayFixtureDto {
  id: string;
  kickoffAt: string;
  competition: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  status: FixtureStatus;
  outcomes: {
    home: { points: number };
    draw: { points: number };
    away: { points: number };
  };
}

export async function getTodayFixtures(
  dependencies: TodayFixturesDependencies,
): Promise<{ businessDate: string; fixtures: TodayFixtureDto[] }> {
  const now = dependencies.clock.now();
  const businessDate = getBusinessDate(now);
  const { startUtc, endUtc } = getBusinessDayRangeUtc(businessDate);
  const fixtures = await dependencies.prisma.fixture.findMany({
    where: {
      kickoffAt: {
        gte: startUtc,
        lt: endUtc,
      },
      competition: {
        isActive: true,
        code: {
          in: [...SUPPORTED_COMPETITION_CODES],
        },
      },
      scoringSnapshotId: {
        not: null,
      },
    },
    include: {
      competition: true,
      homeTeam: true,
      awayTeam: true,
      scoringSnapshot: true,
    },
    orderBy: [{ kickoffAt: "asc" }, { id: "asc" }],
    take: 100,
  });

  return {
    businessDate,
    fixtures: fixtures.flatMap((fixture) =>
      fixture.scoringSnapshot
        ? [
            {
              id: fixture.id,
              kickoffAt: fixture.kickoffAt.toISOString(),
              competition: {
                id: fixture.competition.id,
                code: fixture.competition.code,
                name: fixture.competition.name,
                slug: fixture.competition.slug,
              },
              homeTeam: {
                id: fixture.homeTeam.id,
                name: fixture.homeTeam.name,
                slug: fixture.homeTeam.slug,
                shortName: fixture.homeTeam.shortName,
              },
              awayTeam: {
                id: fixture.awayTeam.id,
                name: fixture.awayTeam.name,
                slug: fixture.awayTeam.slug,
                shortName: fixture.awayTeam.shortName,
              },
              status: fixture.status,
              outcomes: {
                home: { points: fixture.scoringSnapshot.homePoints },
                draw: { points: fixture.scoringSnapshot.drawPoints },
                away: { points: fixture.scoringSnapshot.awayPoints },
              },
            },
          ]
        : [],
    ),
  };
}
