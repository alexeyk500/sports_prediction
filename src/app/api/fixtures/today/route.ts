import { NextResponse, type NextRequest } from "next/server";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import { getRoutePrismaClient, requireAuthenticatedUser } from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { getTodayFixtures } from "@/modules/fixtures/today-fixtures.service";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    const result = await getTodayFixtures({
      prisma: getRoutePrismaClient(),
      clock: systemClock,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
