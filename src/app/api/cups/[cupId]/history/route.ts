import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { getCupHistory } from "@/modules/predictions/prediction-read.service";
import { findActiveTournamentForInstant } from "@/modules/tournaments/tournament.service";

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
    const prisma = getRoutePrismaClient();
    const activeTournament = await findActiveTournamentForInstant(
      { prisma },
      systemClock.now(),
    );

    if (!activeTournament || activeTournament.id !== cupId) {
      return jsonError(
        "TOURNAMENT_NOT_FOUND",
        "Current tournament was not found.",
        404,
      );
    }

    const result = await getCupHistory(
      {
        prisma,
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        tournamentId: activeTournament.id,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
