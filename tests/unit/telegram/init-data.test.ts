import { describe, expect, it } from "vitest";
import {
  TelegramAuthError,
  validateTelegramInitData,
} from "@/lib/telegram/init-data";
import { signTelegramInitData } from "@/lib/telegram/init-data-signing";

const botToken = "123456:test_bot_token";
const now = new Date("2026-09-05T12:00:00.000Z");
const authDate = Math.floor(now.getTime() / 1000);

describe("Telegram Mini App initData validation", () => {
  it("accepts valid initData", () => {
    const initData = signInitData({
      auth_date: String(authDate),
      query_id: "test-query",
      user: JSON.stringify({
        id: 9007199254740993n.toString(),
        username: "alice",
        first_name: "Alice",
        last_name: "Example",
        language_code: "en",
      }),
    });

    expect(validateTelegramInitData(initData, { botToken, now })).toMatchObject(
      {
        user: {
          id: 9007199254740993n,
          username: "alice",
          firstName: "Alice",
          lastName: "Example",
          languageCode: "en",
        },
      },
    );
  });

  it("rejects invalid hash", () => {
    const initData = signInitData({
      auth_date: String(authDate),
      user: JSON.stringify({ id: 1001 }),
    }).replace(/hash=[0-9a-f]+/, "hash=00");

    expect(() => validateTelegramInitData(initData, { botToken, now })).toThrow(
      TelegramAuthError,
    );
  });

  it("rejects modified user payload", () => {
    const initData = signInitData({
      auth_date: String(authDate),
      user: JSON.stringify({ id: 1001, username: "alice" }),
    }).replace("alice", "mallory");

    expect(() => validateTelegramInitData(initData, { botToken, now })).toThrow(
      TelegramAuthError,
    );
  });

  it("rejects expired auth_date", () => {
    const initData = signInitData({
      auth_date: String(authDate - 120),
      user: JSON.stringify({ id: 1001 }),
    });

    expect(
      catchTelegramAuthError(() =>
        validateTelegramInitData(initData, {
          botToken,
          now,
          maxAgeSeconds: 60,
        }),
      ),
    ).toMatchObject({
      code: "EXPIRED_TELEGRAM_INIT_DATA",
    } satisfies Partial<TelegramAuthError>);
  });

  it("rejects malformed initData", () => {
    expect(
      catchTelegramAuthError(() =>
        validateTelegramInitData("not-valid", { botToken, now }),
      ),
    ).toMatchObject({
      code: "INVALID_TELEGRAM_INIT_DATA",
    } satisfies Partial<TelegramAuthError>);
  });

  it("rejects missing initData", () => {
    expect(
      catchTelegramAuthError(() =>
        validateTelegramInitData("", { botToken, now }),
      ),
    ).toMatchObject({
      code: "MISSING_TELEGRAM_INIT_DATA",
    } satisfies Partial<TelegramAuthError>);
  });
});

function catchTelegramAuthError(callback: () => unknown): TelegramAuthError {
  try {
    callback();
  } catch (error) {
    if (error instanceof TelegramAuthError) {
      return error;
    }
  }

  throw new Error("Expected TelegramAuthError.");
}

function signInitData(fields: Record<string, string>): string {
  return signTelegramInitData(fields, botToken);
}
