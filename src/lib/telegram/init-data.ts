import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createTelegramInitDataHashFromEntries } from "./init-data-signing";

export const DEFAULT_TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

export interface TelegramInitDataUser {
  id: bigint;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface ValidatedTelegramInitData {
  authDate: Date;
  user: TelegramInitDataUser;
}

export type TelegramAuthErrorCode =
  | "MISSING_TELEGRAM_INIT_DATA"
  | "INVALID_TELEGRAM_INIT_DATA"
  | "EXPIRED_TELEGRAM_INIT_DATA";

export class TelegramAuthError extends Error {
  readonly code: TelegramAuthErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: TelegramAuthErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "TelegramAuthError";
    this.code = code;
    this.details = details;
  }
}

export interface ValidateTelegramInitDataOptions {
  botToken: string;
  now: Date;
  maxAgeSeconds?: number;
}

const telegramUserSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  language_code: z.string().optional(),
});

export function validateTelegramInitData(
  initData: string,
  options: ValidateTelegramInitDataOptions,
): ValidatedTelegramInitData {
  if (!initData) {
    throw new TelegramAuthError("MISSING_TELEGRAM_INIT_DATA", "Telegram initData is required.");
  }

  if (initData.length > 8192) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram initData is too large.");
  }

  if (!options.botToken) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram auth is not configured.");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDateText = params.get("auth_date");
  const userText = params.get("user");

  if (!hash || !authDateText || !userText) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram initData is malformed.");
  }

  assertValidHash(params, hash, options.botToken);

  const authDateSeconds = Number(authDateText);

  if (!Number.isInteger(authDateSeconds) || authDateSeconds <= 0) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram auth_date is invalid.");
  }

  const authDate = new Date(authDateSeconds * 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_TELEGRAM_INIT_DATA_MAX_AGE_SECONDS;

  if (maxAgeSeconds > 0 && options.now.getTime() - authDate.getTime() > maxAgeSeconds * 1000) {
    throw new TelegramAuthError("EXPIRED_TELEGRAM_INIT_DATA", "Telegram initData is expired.", {
      authDate: authDate.toISOString(),
    });
  }

  return {
    authDate,
    user: parseTelegramUser(userText),
  };
}

function assertValidHash(params: URLSearchParams, receivedHash: string, botToken: string): void {
  const fields = [...params.entries()].filter(([key]) => key !== "hash");
  const expectedHash = createTelegramInitDataHashFromEntries(fields, botToken);
  const received = Buffer.from(receivedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram initData hash is invalid.");
  }
}

function parseTelegramUser(userText: string): TelegramInitDataUser {
  let rawUser: unknown;

  try {
    rawUser = JSON.parse(userText);
  } catch {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram user payload is malformed.");
  }

  const parsed = telegramUserSchema.safeParse(rawUser);

  if (!parsed.success) {
    throw new TelegramAuthError("INVALID_TELEGRAM_INIT_DATA", "Telegram user payload is invalid.");
  }

  return {
    id: BigInt(parsed.data.id),
    username: parsed.data.username,
    firstName: parsed.data.first_name,
    lastName: parsed.data.last_name,
    languageCode: parsed.data.language_code,
  };
}
