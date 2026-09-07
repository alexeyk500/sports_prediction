import { NextResponse, type NextRequest } from "next/server";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { getTodayPredictions } from "@/modules/predictions/prediction-read.service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const result = await getTodayPredictions(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      auth.user.id,
    );

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
