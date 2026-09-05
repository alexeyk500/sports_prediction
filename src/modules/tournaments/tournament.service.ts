import type { Prisma, PrismaClient, Tournament } from "@prisma/client";
import type { Clock } from "@/lib/time/clock";
import { DomainError } from "@/lib/errors/domain-error";
import { assertTournamentUsableForPrediction } from "./tournament.domain";

export interface TournamentServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

type TournamentReadableClient = Pick<PrismaClient | Prisma.TransactionClient, "tournament">;

export async function findActiveTournamentForInstant(
  { prisma }: { prisma: TournamentReadableClient },
  instant: Date,
): Promise<Tournament | null> {
  return prisma.tournament.findFirst({
    where: {
      status: "ACTIVE",
      startsAt: {
        lte: instant,
      },
      endsAt: {
        gt: instant,
      },
    },
    orderBy: {
      startsAt: "desc",
    },
  });
}

export async function requireActiveTournamentForPrediction(
  dependencies: TournamentServiceDependencies,
): Promise<Tournament> {
  const now = dependencies.clock.now();
  const tournament = await findActiveTournamentForInstant(dependencies, now);

  if (!tournament) {
    throw new DomainError("NO_ACTIVE_TOURNAMENT", "No active tournament found.", {
      instant: now.toISOString(),
    });
  }

  assertTournamentUsableForPrediction(tournament);

  return tournament;
}
