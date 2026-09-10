import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { systemClock } from "@/lib/time/clock";
import { confirmMonetagRewardSession } from "@/modules/ad-rewards/monetag-reward.service";

const routeParamsSchema = z.object({
  adRewardId: z.string().uuid(),
});

interface IConfirmMonetagRewardSessionRouteContext {
  params: Promise<{
    adRewardId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  context: IConfirmMonetagRewardSessionRouteContext,
) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const params = routeParamsSchema.parse(await context.params);
    const result = await confirmMonetagRewardSession(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        adRewardId: params.adRewardId,
      },
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
