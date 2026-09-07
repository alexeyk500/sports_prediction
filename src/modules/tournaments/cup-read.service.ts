import { Prisma } from "@prisma/client";
import type { PrismaClient, Tournament } from "@prisma/client";

export type CupLeaderboardMode = "top" | "all";

export interface CupLeaderboardEntryDto {
  userId: string;
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  correct: number;
  wrong: number;
  totalPredictions: number;
  points: number;
  isCurrentUser: boolean;
  telegramUrl: string | null;
}

export interface CupLeaderboardPageDto {
  items: CupLeaderboardEntryDto[];
  nextCursor: string | null;
  totalParticipants: number;
}

export interface CupAroundMeLeaderboardDto {
  items: CupLeaderboardEntryDto[];
  currentUserRank: number | null;
  totalParticipants: number;
}

export interface CurrentCupSummaryDto {
  participantCount: number;
  currentUserRow: CupLeaderboardEntryDto | null;
}

export interface LeaderboardWindow {
  startRank: number;
  endRank: number;
}

interface RankedParticipantRow {
  userId: string;
  telegramUserId: bigint;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  tournamentPoints: number;
  predictionsCount: number;
  correctPredictionsCount: number;
  wrongPredictions: number | bigint;
  rank: number | bigint;
  totalParticipants: number | bigint;
}

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_AROUND_RADIUS = 4;
const MAX_AROUND_RADIUS = 20;

export function normalizeLeaderboardLimit(limit: number | undefined): number {
  if (!Number.isInteger(limit) || limit === undefined || limit <= 0) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(limit, MAX_PAGE_LIMIT);
}

export function normalizeAroundMeRadius(radius: number | undefined): number {
  if (!Number.isInteger(radius) || radius === undefined || radius < 0) {
    return DEFAULT_AROUND_RADIUS;
  }

  return Math.min(radius, MAX_AROUND_RADIUS);
}

export function calculateAroundMeWindow(
  totalParticipants: number,
  currentUserRank: number,
  radius: number,
): LeaderboardWindow {
  const windowSize = (radius * 2) + 1;
  const maxStartRank = Math.max(1, totalParticipants - windowSize + 1);
  const startRank = Math.min(Math.max(1, currentUserRank - radius), maxStartRank);
  const endRank = Math.min(totalParticipants, startRank + windowSize - 1);

  return { startRank, endRank };
}

export function mergeLeaderboardEntries(
  currentEntries: CupLeaderboardEntryDto[],
  nextEntries: CupLeaderboardEntryDto[],
): CupLeaderboardEntryDto[] {
  const seenUserIds = new Set(currentEntries.map((entry) => entry.userId));
  const uniqueNextEntries = nextEntries.filter((entry) => {
    if (seenUserIds.has(entry.userId)) {
      return false;
    }

    seenUserIds.add(entry.userId);
    return true;
  });

  return [...currentEntries, ...uniqueNextEntries];
}

export async function getCurrentCupSummary(
  prisma: PrismaClient,
  tournament: Pick<Tournament, "id"> | null,
  currentUserId: string,
): Promise<CurrentCupSummaryDto | null> {
  if (!tournament) {
    return null;
  }

  const aroundMe = await getCupLeaderboardAroundMe(prisma, {
    tournamentId: tournament.id,
    currentUserId,
    radius: 0,
  });

  return {
    participantCount: aroundMe.totalParticipants,
    currentUserRow: aroundMe.items[0] ?? null,
  };
}

export async function getCupLeaderboardPage(
  prisma: PrismaClient,
  input: {
    tournamentId: string;
    currentUserId: string;
    mode: CupLeaderboardMode;
    limit?: number;
    cursor?: string | null;
  },
): Promise<CupLeaderboardPageDto> {
  const limit = normalizeLeaderboardLimit(input.limit);
  const cursorRank = parseCursorRank(input.cursor);
  const rows = await queryLeaderboardRowsByRank(prisma, {
    tournamentId: input.tournamentId,
    currentUserId: input.currentUserId,
    startExclusiveRank: cursorRank,
    limit,
  });
  const items = rows.map((row) => toLeaderboardEntry(row, input.currentUserId));
  const totalParticipants = toNumber(rows[0]?.totalParticipants ?? 0);
  const lastRank = items.at(-1)?.rank ?? cursorRank;
  const hasNextPage = input.mode === "all" && items.length === limit && lastRank < totalParticipants;

  return {
    items,
    nextCursor: hasNextPage ? String(lastRank) : null,
    totalParticipants,
  };
}

export async function getCupLeaderboardAroundMe(
  prisma: PrismaClient,
  input: {
    tournamentId: string;
    currentUserId: string;
    radius?: number;
  },
): Promise<CupAroundMeLeaderboardDto> {
  const radius = normalizeAroundMeRadius(input.radius);
  const currentUserPosition = await queryCurrentUserPosition(prisma, input.tournamentId, input.currentUserId);

  if (!currentUserPosition) {
    const totalParticipants = await prisma.tournamentParticipant.count({
      where: { tournamentId: input.tournamentId },
    });

    return { items: [], currentUserRank: null, totalParticipants };
  }

  const currentUserRank = toNumber(currentUserPosition.rank);
  const totalParticipants = toNumber(currentUserPosition.totalParticipants);
  const window = calculateAroundMeWindow(totalParticipants, currentUserRank, radius);
  const rows = await queryLeaderboardRowsBetweenRanks(prisma, {
    tournamentId: input.tournamentId,
    currentUserId: input.currentUserId,
    startRank: window.startRank,
    endRank: window.endRank,
  });

  return {
    items: rows.map((row) => toLeaderboardEntry(row, input.currentUserId)),
    currentUserRank,
    totalParticipants,
  };
}

async function queryCurrentUserPosition(
  prisma: PrismaClient,
  tournamentId: string,
  currentUserId: string,
): Promise<Pick<RankedParticipantRow, "rank" | "totalParticipants"> | null> {
  const rows = await prisma.$queryRaw<Array<Pick<RankedParticipantRow, "rank" | "totalParticipants">>>`
    WITH ranked AS (
      SELECT
        tp."userId",
        (ROW_NUMBER() OVER (ORDER BY tp."tournamentPoints" DESC, tp.id ASC))::int AS "rank",
        (COUNT(*) OVER())::int AS "totalParticipants"
      FROM "TournamentParticipant" tp
      WHERE tp."tournamentId" = ${tournamentId}::uuid
    )
    SELECT "rank", "totalParticipants"
    FROM ranked
    WHERE "userId" = ${currentUserId}::uuid
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function queryLeaderboardRowsByRank(
  prisma: PrismaClient,
  input: {
    tournamentId: string;
    currentUserId: string;
    startExclusiveRank: number;
    limit: number;
  },
): Promise<RankedParticipantRow[]> {
  return prisma.$queryRaw<RankedParticipantRow[]>`
    ${rankedParticipantsSql(input.tournamentId)}
    SELECT *
    FROM ranked
    WHERE "rank" > ${input.startExclusiveRank}
    ORDER BY "rank" ASC
    LIMIT ${input.limit}
  `;
}

async function queryLeaderboardRowsBetweenRanks(
  prisma: PrismaClient,
  input: {
    tournamentId: string;
    currentUserId: string;
    startRank: number;
    endRank: number;
  },
): Promise<RankedParticipantRow[]> {
  return prisma.$queryRaw<RankedParticipantRow[]>`
    ${rankedParticipantsSql(input.tournamentId)}
    SELECT *
    FROM ranked
    WHERE "rank" BETWEEN ${input.startRank} AND ${input.endRank}
    ORDER BY "rank" ASC
  `;
}

function rankedParticipantsSql(tournamentId: string): Prisma.Sql {
  return Prisma.sql`
    WITH incorrect AS (
      SELECT
        p."userId",
        COUNT(*)::int AS "wrongPredictions"
      FROM "Prediction" p
      WHERE p."tournamentId" = ${tournamentId}::uuid
        AND p."resultStatus" = 'INCORRECT'
      GROUP BY p."userId"
    ),
    ranked AS (
      SELECT
        tp."userId",
        u."telegramUserId",
        u.username,
        u."firstName",
        u."lastName",
        tp."tournamentPoints",
        tp."predictionsCount",
        tp."correctPredictionsCount",
        COALESCE(incorrect."wrongPredictions", 0)::int AS "wrongPredictions",
        (ROW_NUMBER() OVER (ORDER BY tp."tournamentPoints" DESC, tp.id ASC))::int AS "rank",
        (COUNT(*) OVER())::int AS "totalParticipants"
      FROM "TournamentParticipant" tp
      JOIN "User" u ON u.id = tp."userId"
      LEFT JOIN incorrect ON incorrect."userId" = tp."userId"
      WHERE tp."tournamentId" = ${tournamentId}::uuid
    )
  `;
}

function parseCursorRank(cursor: string | null | undefined): number {
  if (!cursor) {
    return 0;
  }

  const parsed = Number.parseInt(cursor, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function toLeaderboardEntry(row: RankedParticipantRow, currentUserId: string): CupLeaderboardEntryDto {
  const username = row.username?.trim() || null;

  return {
    userId: row.userId,
    rank: toNumber(row.rank),
    displayName: formatDisplayName(row),
    avatarUrl: null,
    correct: row.correctPredictionsCount,
    wrong: toNumber(row.wrongPredictions),
    totalPredictions: row.predictionsCount,
    points: row.tournamentPoints,
    isCurrentUser: row.userId === currentUserId,
    telegramUrl: username ? `https://t.me/${username}` : null,
  };
}

function formatDisplayName(user: {
  telegramUserId: bigint;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  if (user.username) {
    return user.username;
  }

  return `User ${user.telegramUserId.toString()}`;
}

function toNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}
