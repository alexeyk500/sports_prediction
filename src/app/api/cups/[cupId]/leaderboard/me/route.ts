import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { getCupLeaderboardAroundMe } from "@/modules/tournaments/cup-read.service";

const aroundMeQuerySchema = z.object({
  radius: z.coerce.number().int().min(0).optional(),
});

const paramsSchema = z.object({
  cupId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cupId: string }> },
) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const { cupId } = paramsSchema.parse(await context.params);
    const query = aroundMeQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const prisma = getRoutePrismaClient();
    const tournament = await prisma.tournament.findUnique({
      where: { id: cupId },
      select: { id: true },
    });

    if (!tournament) {
      return jsonError(
        "TOURNAMENT_NOT_FOUND",
        "Tournament was not found.",
        404,
      );
    }

    const result = await getCupLeaderboardAroundMe(prisma, {
      tournamentId: tournament.id,
      currentUserId: auth.user.id,
      radius: query.radius,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
