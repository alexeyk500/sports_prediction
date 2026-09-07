import type { PrismaClient } from "@prisma/client";
import {
  BUSINESS_TIMEZONE,
  businessDateToDatabaseDate,
  getBusinessDate,
} from "@/lib/time/business-time";
import type { Clock } from "@/lib/time/clock";
import {
  DAILY_PREDICTION_LIMIT,
  FREE_PREDICTION_LIMIT,
  REWARDED_PREDICTION_LIMIT,
} from "@/modules/predictions/prediction.domain";
import {
  getCurrentCupSummary,
  type CurrentCupSummaryDto,
} from "@/modules/tournaments/cup-read.service";
import { findActiveTournamentForInstant } from "@/modules/tournaments/tournament.service";

export interface BootstrapDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export interface BootstrapDto {
  user: {
    id: string;
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    languageCode: string | null;
  };
  settings: {
    locale: string;
    appearance: string;
  };
  currentTournament: {
    id: string;
    number: number;
    startsAt: string;
    endsAt: string;
    prizePoolNanoTon: string;
  } | null;
  dailyPredictionUsage: {
    businessDate: string;
    freeUsed: number;
    freeLimit: number;
    rewardedUsed: number;
    rewardedLimit: number;
    totalUsed: number;
    totalLimit: number;
  };
  rating: {
    rating: number;
    league: string;
    qualifiedCupsCount: number;
  } | null;
  cup: CurrentCupSummaryDto | null;
  serverTime: string;
  businessTimezone: typeof BUSINESS_TIMEZONE;
}

export async function getBootstrap(
  dependencies: BootstrapDependencies,
  userId: string,
): Promise<BootstrapDto> {
  const now = dependencies.clock.now();
  const businessDate = getBusinessDate(now);
  const [user, tournament, usage, rating] = await Promise.all([
    dependencies.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    findActiveTournamentForInstant({ prisma: dependencies.prisma }, now),
    dependencies.prisma.dailyPredictionUsage.findUnique({
      where: {
        userId_businessDate: {
          userId,
          businessDate: businessDateToDatabaseDate(businessDate),
        },
      },
    }),
    dependencies.prisma.ratingProfile.findUnique({ where: { userId } }),
  ]);
  const cup = await getCurrentCupSummary(
    dependencies.prisma,
    tournament,
    userId,
  );
  const freeUsed = usage?.freeUsed ?? 0;
  const rewardedUsed = usage?.rewardedUsed ?? 0;

  return {
    user: {
      id: user.id,
      telegramUserId: user.telegramUserId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      languageCode: user.languageCode,
    },
    settings: {
      locale: user.locale,
      appearance: user.appearance,
    },
    currentTournament: tournament
      ? {
          id: tournament.id,
          number: tournament.number,
          startsAt: tournament.startsAt.toISOString(),
          endsAt: tournament.endsAt.toISOString(),
          prizePoolNanoTon: tournament.prizePoolNanoTon.toString(),
        }
      : null,
    dailyPredictionUsage: {
      businessDate,
      freeUsed,
      freeLimit: FREE_PREDICTION_LIMIT,
      rewardedUsed,
      rewardedLimit: REWARDED_PREDICTION_LIMIT,
      totalUsed: freeUsed + rewardedUsed,
      totalLimit: DAILY_PREDICTION_LIMIT,
    },
    rating: rating
      ? {
          rating: rating.rating,
          league: rating.league,
          qualifiedCupsCount: rating.qualifiedCupsCount,
        }
      : null,
    cup,
    serverTime: now.toISOString(),
    businessTimezone: BUSINESS_TIMEZONE,
  };
}
