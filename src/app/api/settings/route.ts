import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiErrorResponse } from "@/lib/http/api-errors";
import { getRoutePrismaClient, requireAuthenticatedUser } from "@/lib/http/auth";
import { readJsonBody } from "@/lib/http/json-body";
import { updateUserSettings, getUserSettings } from "@/modules/settings/settings.service";

const settingsBodySchema = z.object({
  locale: z.enum(["en", "ru", "de", "es", "ar"]).optional(),
  appearance: z.enum(["system", "light", "dark"]).optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const settings = await getUserSettings({ prisma: getRoutePrismaClient() }, auth.user.id);

    return NextResponse.json(settings);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const body = settingsBodySchema.parse(await readJsonBody(request));
    const settings = await updateUserSettings(
      { prisma: getRoutePrismaClient() },
      {
        userId: auth.user.id,
        locale: body.locale,
        appearance: body.appearance,
      },
    );

    return NextResponse.json(settings);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
