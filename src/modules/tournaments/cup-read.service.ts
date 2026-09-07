import type { PrismaClient, Tournament } from "@prisma/client";

export interface CupLeaderboardRowDto {
  id: string;
  rank: number;
  playerName: string;
  correctPredictions: number;
  wrongPredictions: number;
  predictionsCount: number;
  points: number;
  isCurrentUser: boolean;
  telegramUrl: string | null;
}

export interface CurrentCupSummaryDto {
  participantCount: number;
  leaderboardRows: CupLeaderboardRowDto[];
  pinnedCurrentUserRow: CupLeaderboardRowDto | null;
}

interface TournamentParticipantForLeaderboard {
  id: string;
  userId: string;
  tournamentPoints: number;
  predictionsCount: number;
  correctPredictionsCount: number;
  user: {
    telegramUserId: bigint;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function getCurrentCupSummary(
  prisma: PrismaClient,
  tournament: Pick<Tournament, "id"> | null,
  currentUserId: string,
): Promise<CurrentCupSummaryDto | null> {
  if (!tournament) {
    return null;
  }

  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId: tournament.id },
    include: {
      user: {
        select: {
          telegramUserId: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ tournamentPoints: "desc" }, { id: "asc" }],
    take: 1_000,
  });
  const participantCount = await prisma.tournamentParticipant.count({
    where: { tournamentId: tournament.id },
  });
  const currentUserIndex = participants.findIndex((participant) => participant.userId === currentUserId);
  const topParticipants = participants.slice(0, 10);
  const pinnedParticipant =
    currentUserIndex >= 10 ? participants[currentUserIndex] ?? null : null;
  const visibleParticipants = pinnedParticipant ? [...topParticipants, pinnedParticipant] : topParticipants;
  const incorrectCountsByUserId = await getIncorrectPredictionCountsByUserId(
    prisma,
    tournament.id,
    visibleParticipants.map((participant) => participant.userId),
  );

  const toRow = (participant: TournamentParticipantForLeaderboard, index: number): CupLeaderboardRowDto => ({
    id: participant.id,
    rank: index + 1,
    playerName: formatPlayerName(participant),
    correctPredictions: participant.correctPredictionsCount,
    wrongPredictions: incorrectCountsByUserId.get(participant.userId) ?? 0,
    predictionsCount: participant.predictionsCount,
    points: participant.tournamentPoints,
    isCurrentUser: participant.userId === currentUserId,
    telegramUrl: participant.user.username ? `https://t.me/${participant.user.username}` : null,
  });

  return {
    participantCount,
    leaderboardRows: topParticipants.map((participant, index) => toRow(participant, index)),
    pinnedCurrentUserRow: pinnedParticipant ? toRow(pinnedParticipant, currentUserIndex) : null,
  };
}

async function getIncorrectPredictionCountsByUserId(
  prisma: PrismaClient,
  tournamentId: string,
  userIds: string[],
): Promise<Map<string, number>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const grouped = await prisma.prediction.groupBy({
    by: ["userId"],
    where: {
      tournamentId,
      userId: { in: userIds },
      resultStatus: "INCORRECT",
    },
    _count: { _all: true },
  });

  return new Map(grouped.map((row) => [row.userId, row._count._all]));
}

function formatPlayerName(participant: TournamentParticipantForLeaderboard): string {
  const firstName = participant.user.firstName?.trim();
  const lastName = participant.user.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  if (participant.user.username) {
    return participant.user.username;
  }

  return `User ${participant.user.telegramUserId.toString()}`;
}
