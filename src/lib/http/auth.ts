import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
import { createPrismaClient } from "@/lib/prisma/client";
import { systemClock } from "@/lib/time/clock";
import {
  TelegramAuthError,
  validateTelegramInitData,
} from "@/lib/telegram/init-data";
import { syncTelegramUser } from "@/modules/users/user-sync.service";

export const TELEGRAM_INIT_DATA_HEADER = "x-telegram-init-data";
export const IDEMPOTENCY_KEY_HEADER = "idempotency-key";

export interface AuthenticatedRequestContext {
  user: User;
}

const prisma = createPrismaClient();

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedRequestContext> {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);

  if (!initData) {
    throw new TelegramAuthError(
      "MISSING_TELEGRAM_INIT_DATA",
      "Telegram initData is required.",
    );
  }

  const validated = validateTelegramInitData(initData, {
    botToken: requireTelegramBotToken(),
    now: systemClock.now(),
    maxAgeSeconds: getTelegramInitDataMaxAgeSeconds(),
  });
  const user = await syncTelegramUser({ prisma }, validated.user);

  return { user };
}

export function getRoutePrismaClient() {
  return prisma;
}

function requireTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new TelegramAuthError(
      "INVALID_TELEGRAM_INIT_DATA",
      "Telegram auth is not configured.",
    );
  }

  return token;
}

function getTelegramInitDataMaxAgeSeconds(): number {
  const configured = process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS;

  if (!configured) {
    return 24 * 60 * 60;
  }

  const parsed = Number(configured);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 24 * 60 * 60;
  }

  return parsed;
}
