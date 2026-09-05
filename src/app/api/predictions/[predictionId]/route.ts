import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import { getRoutePrismaClient, requireAuthenticatedUser } from "@/lib/http/auth";
import { readJsonBody } from "@/lib/http/json-body";
import { systemClock } from "@/lib/time/clock";
import { updatePrediction } from "@/modules/predictions/prediction.service";

const updatePredictionBodySchema = z.object({
  selectedOutcome: z.enum(["HOME", "DRAW", "AWAY"]),
}).strict();

const paramsSchema = z.object({
  predictionId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ predictionId: string }> },
) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const params = paramsSchema.parse(await context.params);
    const body = updatePredictionBodySchema.parse(await readJsonBody(request));
    const result = await updatePrediction(
      {
        prisma: getRoutePrismaClient(),
        clock: systemClock,
      },
      {
        userId: auth.user.id,
        predictionId: params.predictionId,
        selectedOutcome: body.selectedOutcome,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
