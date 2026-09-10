import { Prisma, type PrismaClient, type Tournament } from "@prisma/client";
import type { Clock } from "@/lib/time/clock";
import { createPrizeEntitlementsFromFinalRanks } from "@/modules/prizes/prize.service";
import { DomainError } from "@/lib/errors/domain-error";
import { assertTournamentUsableForPrediction } from "./tournament.domain";

export interface TournamentServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

type TournamentReadableClient = Pick<
  PrismaClient | Prisma.TransactionClient,
  "tournament"
>;

export interface FinalizeTournamentSettlementResult {
  tournamentId: string;
  prizeEntitlementsCreated: number;
}

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
    throw new DomainError(
      "NO_ACTIVE_TOURNAMENT",
      "No active tournament found.",
      {
        instant: now.toISOString(),
      },
    );
  }

  assertTournamentUsableForPrediction(tournament);

  return tournament;
}

export async function finalizeTournamentSettlement(
  dependencies: TournamentServiceDependencies,
  tournamentId: string,
): Promise<FinalizeTournamentSettlementResult> {
  const finalizedAt = dependencies.clock.now();

  return dependencies.prisma.$transaction(
    async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true },
      });

      if (!tournament) {
        throw new DomainError("TOURNAMENT_NOT_FOUND", "Tournament not found.", {
          tournamentId,
        });
      }

      await tx.$executeRaw`
        WITH ranked AS (
          SELECT
            id,
            (ROW_NUMBER() OVER (ORDER BY "tournamentPoints" DESC, id ASC))::int AS rank
          FROM "TournamentParticipant"
          WHERE "tournamentId" = ${tournamentId}::uuid
        )
        UPDATE "TournamentParticipant" participant
        SET "finalRank" = ranked.rank,
            "updatedAt" = ${finalizedAt}
        FROM ranked
        WHERE participant.id = ranked.id
      `;

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "FINISHED" },
      });

      const entitlements = await createPrizeEntitlementsFromFinalRanks(
        tx,
        tournamentId,
        finalizedAt,
      );

      return {
        tournamentId,
        prizeEntitlementsCreated: entitlements.created,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
