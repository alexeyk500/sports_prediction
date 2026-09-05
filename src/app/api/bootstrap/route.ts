import { NextResponse, type NextRequest } from "next/server";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import { getRoutePrismaClient, requireAuthenticatedUser } from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { getBootstrap } from "@/modules/bootstrap/bootstrap.service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const bootstrap = await getBootstrap(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      auth.user.id,
    );

    return NextResponse.json(bootstrap);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
