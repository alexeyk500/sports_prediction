import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { readJsonBody } from "@/lib/http/json-body";
import { systemClock } from "@/lib/time/clock";
import { createMonetagRewardSession } from "@/modules/ad-rewards/monetag-reward.service";

const createSessionBodySchema = z
  .object({
    fixtureId: z.string().uuid(),
    selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const body = createSessionBodySchema.parse(await readJsonBody(request));
    const result = await createMonetagRewardSession(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        fixtureId: body.fixtureId,
        selectedOutcome: body.selectedOutcome,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
