import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, toApiErrorResponse } from "@/lib/http/api-errors";
import { getRoutePrismaClient, IDEMPOTENCY_KEY_HEADER, requireAuthenticatedUser } from "@/lib/http/auth";
import { readJsonBody } from "@/lib/http/json-body";
import { systemClock } from "@/lib/time/clock";
import { createPrediction } from "@/modules/predictions/prediction.service";

const createPredictionBodySchema = z.object({
  fixtureId: z.string().uuid(),
  selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]),
  adRewardId: z.string().uuid().optional(),
}).strict();

const idempotencyKeySchema = z.string().trim().min(1).max(128);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const idempotencyKeyResult = idempotencyKeySchema.safeParse(request.headers.get(IDEMPOTENCY_KEY_HEADER));

    if (!idempotencyKeyResult.success) {
      return jsonError("VALIDATION_ERROR", "Idempotency-Key header is required.", 400);
    }

    const body = createPredictionBodySchema.parse(await readJsonBody(request));
    const result = await createPrediction(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        fixtureId: body.fixtureId,
        selectedOutcome: body.selectedOutcome,
        adRewardId: body.adRewardId,
        idempotencyKey: idempotencyKeyResult.data,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
