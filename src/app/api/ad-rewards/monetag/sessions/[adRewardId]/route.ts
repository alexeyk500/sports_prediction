import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { getMonetagRewardSession } from "@/modules/ad-rewards/monetag-reward.service";

const paramsSchema = z.object({
  adRewardId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ adRewardId: string }> },
) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const params = paramsSchema.parse(await context.params);
    const result = await getMonetagRewardSession(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        adRewardId: params.adRewardId,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
