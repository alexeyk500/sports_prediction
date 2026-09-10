import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import {
  getRoutePrismaClient,
  requireAuthenticatedUser,
} from "@/lib/http/auth";
import { readJsonBody } from "@/lib/http/json-body";
import { systemClock } from "@/lib/time/clock";
import { submitPrizeClaim } from "@/modules/prizes/prize.service";

const claimBodySchema = z
  .object({
    walletAddress: z.string().min(1).max(64),
  })
  .strict();

interface IRouteContext {
  params: Promise<{
    entitlementId: string;
  }>;
}

export async function POST(request: NextRequest, context: IRouteContext) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const params = await context.params;
    const body = claimBodySchema.parse(await readJsonBody(request));
    const result = await submitPrizeClaim(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        entitlementId: params.entitlementId,
        walletAddress: body.walletAddress,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
