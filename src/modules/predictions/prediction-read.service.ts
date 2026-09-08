import type {
  PredictionResultStatus,
  PredictionSlotType,
  PrismaClient,
} from "@prisma/client";
import {
  getBusinessDate,
  getBusinessDayRangeUtc,
} from "@/lib/time/business-time";
import type { Clock } from "@/lib/time/clock";

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
  const businessDate = getBusinessDate(now);
  const { startUtc, endUtc } = getBusinessDayRangeUtc(businessDate);
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
      fixture: true,
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
    const businessDate = getBusinessDate(prediction.fixture.kickoffAt);
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
): Omit<PredictionDto, "kickoffAt"> & {
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
