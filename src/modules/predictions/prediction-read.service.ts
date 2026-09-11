import type {
  FixtureStatus,
  PredictionOutcome,
  PredictionResultStatus,
  PredictionSlotType,
  PrismaClient,
} from "@prisma/client";
import { getUtcDateKey, getUtcDayRange } from "@/lib/time/utc-day";
import type { Clock } from "@/lib/time/clock";
import { winningOutcomeForFixture } from "@/modules/fixtures/today-fixtures.service";

export interface TodayPredictionsDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export interface PredictionDto {
  id: string;
  fixtureId: string;
  selectedOutcome: "HOME" | "DRAW" | "AWAY";
  slotType: PredictionSlotType;
  potentialPoints: number;
  earnedPoints: number;
  resultStatus: PredictionResultStatus;
  kickoffAt: string;
  editable: boolean;
  fixture: PredictionFixtureContextDto;
}

export interface PredictionFixtureContextDto {
  id: string;
  kickoffAt: string;
  status: FixtureStatus;
  winningOutcome: PredictionOutcome | null;
  competition: CupHistoryCompetitionDto;
  homeTeam: CupHistoryTeamDto;
  awayTeam: CupHistoryTeamDto;
  outcomes: {
    home: { points: number };
    draw: { points: number };
    away: { points: number };
  };
}

export interface CupHistoryTeamDto {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
}

export interface CupHistoryCompetitionDto {
  id: string;
  code: string;
  name: string;
  slug: string;
}

export interface CupHistoryPredictionDto {
  id: string;
  fixtureId: string;
  selectedOutcome: "HOME" | "DRAW" | "AWAY";
  slotType: PredictionSlotType;
  potentialPoints: number;
  earnedPoints: number;
  resultStatus: PredictionResultStatus;
  kickoffAt: string;
  competition: CupHistoryCompetitionDto;
  homeTeam: CupHistoryTeamDto;
  awayTeam: CupHistoryTeamDto;
  homeScore: number | null;
  awayScore: number | null;
}

export interface CupHistoryDayDto {
  businessDate: string;
  predictions: CupHistoryPredictionDto[];
}

export interface CupHistoryResponseDto {
  cupId: string;
  days: CupHistoryDayDto[];
}

export async function getTodayPredictions(
  dependencies: TodayPredictionsDependencies,
  userId: string,
): Promise<{ businessDate: string; predictions: PredictionDto[] }> {
  const now = dependencies.clock.now();
  const businessDate = getUtcDateKey(now);
  const { startUtc, endUtc } = getUtcDayRange(businessDate);
  const predictions = await dependencies.prisma.prediction.findMany({
    where: {
      userId,
      fixture: {
        kickoffAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
    },
    include: {
      fixture: {
        include: {
          competition: true,
          homeTeam: true,
          awayTeam: true,
        },
      },
      outcomeSnapshot: true,
    },
    orderBy: [{ fixture: { kickoffAt: "asc" } }, { id: "asc" }],
    take: 100,
  });

  return {
    businessDate,
    predictions: predictions.map((prediction) => ({
      id: prediction.id,
      fixtureId: prediction.fixtureId,
      selectedOutcome: prediction.selectedOutcome,
      slotType: prediction.slotType,
      potentialPoints: prediction.potentialPoints,
      earnedPoints: prediction.earnedPoints,
      resultStatus: prediction.resultStatus,
      kickoffAt: prediction.fixture.kickoffAt.toISOString(),
      editable: now.getTime() < prediction.fixture.kickoffAt.getTime(),
      fixture: {
        id: prediction.fixture.id,
        kickoffAt: prediction.fixture.kickoffAt.toISOString(),
        status: prediction.fixture.status,
        winningOutcome: winningOutcomeForFixture(
          prediction.fixture.status,
          prediction.fixture.finalOutcome,
        ),
        competition: {
          id: prediction.fixture.competition.id,
          code: prediction.fixture.competition.code,
          name: prediction.fixture.competition.name,
          slug: prediction.fixture.competition.slug,
        },
        homeTeam: {
          id: prediction.fixture.homeTeam.id,
          name: prediction.fixture.homeTeam.name,
          slug: prediction.fixture.homeTeam.slug,
          shortName: prediction.fixture.homeTeam.shortName,
        },
        awayTeam: {
          id: prediction.fixture.awayTeam.id,
          name: prediction.fixture.awayTeam.name,
          slug: prediction.fixture.awayTeam.slug,
          shortName: prediction.fixture.awayTeam.shortName,
        },
        outcomes: {
          home: { points: prediction.outcomeSnapshot.homePoints },
          draw: { points: prediction.outcomeSnapshot.drawPoints },
          away: { points: prediction.outcomeSnapshot.awayPoints },
        },
      },
    })),
  };
}

export async function getCupHistory(
  dependencies: TodayPredictionsDependencies,
  input: {
    userId: string;
    tournamentId: string;
  },
): Promise<CupHistoryResponseDto> {
  const predictions = await dependencies.prisma.prediction.findMany({
    where: {
      userId: input.userId,
      tournamentId: input.tournamentId,
    },
    include: {
      fixture: {
        include: {
          competition: true,
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: [{ fixture: { kickoffAt: "desc" } }, { id: "desc" }],
    take: 500,
  });
  const days = new Map<string, CupHistoryPredictionDto[]>();

  for (const prediction of predictions) {
    const businessDate = getUtcDateKey(prediction.fixture.kickoffAt);
    const dayPredictions = days.get(businessDate) ?? [];

    dayPredictions.push({
      id: prediction.id,
      fixtureId: prediction.fixtureId,
      selectedOutcome: prediction.selectedOutcome,
      slotType: prediction.slotType,
      potentialPoints: prediction.potentialPoints,
      earnedPoints: prediction.earnedPoints,
      resultStatus: prediction.resultStatus,
      kickoffAt: prediction.fixture.kickoffAt.toISOString(),
      competition: {
        id: prediction.fixture.competition.id,
        code: prediction.fixture.competition.code,
        name: prediction.fixture.competition.name,
        slug: prediction.fixture.competition.slug,
      },
      homeTeam: {
        id: prediction.fixture.homeTeam.id,
        name: prediction.fixture.homeTeam.name,
        slug: prediction.fixture.homeTeam.slug,
        shortName: prediction.fixture.homeTeam.shortName,
      },
      awayTeam: {
        id: prediction.fixture.awayTeam.id,
        name: prediction.fixture.awayTeam.name,
        slug: prediction.fixture.awayTeam.slug,
        shortName: prediction.fixture.awayTeam.shortName,
      },
      homeScore: prediction.fixture.homeScore,
      awayScore: prediction.fixture.awayScore,
    });
    days.set(businessDate, dayPredictions);
  }

  return {
    cupId: input.tournamentId,
    days: Array.from(days, ([businessDate, dayPredictions]) => ({
      businessDate,
      predictions: dayPredictions,
    })),
  };
}

export function toPredictionDto(
  prediction: {
    predictionId: string;
    fixtureId: string;
    selectedOutcome: "HOME" | "DRAW" | "AWAY";
    slotType: PredictionSlotType;
    potentialPoints: number;
  },
  editable: boolean,
): Omit<PredictionDto, "kickoffAt" | "fixture"> & {
  probabilityAtPrediction?: string;
  outcomeSnapshotId?: string;
} {
  return {
    id: prediction.predictionId,
    fixtureId: prediction.fixtureId,
    selectedOutcome: prediction.selectedOutcome,
    slotType: prediction.slotType,
    potentialPoints: prediction.potentialPoints,
    earnedPoints: 0,
    resultStatus: "PENDING",
    editable,
  };
}
