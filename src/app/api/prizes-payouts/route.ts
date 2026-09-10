import { NextResponse, type NextRequest } from "next/server";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { getCurrentUserPrizePayouts } from "@/modules/prizes/prize.service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const result = await getCurrentUserPrizePayouts(
      { prisma: getRoutePrismaClient() },
      auth.user.id,
    );

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
