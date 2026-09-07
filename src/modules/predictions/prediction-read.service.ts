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
