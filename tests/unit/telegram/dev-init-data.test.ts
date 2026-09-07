import { describe, expect, it } from "vitest";
import { validateTelegramInitData } from "@/lib/telegram/init-data";
import {
  assertTelegramDevInitDataCanRun,
  DEV_TELEGRAM_USER,
  generateTelegramDevInitData,
} from "@/lib/telegram/dev-init-data";

const botToken = "123456:test_bot_token";
const now = new Date("2026-09-05T12:34:56.000Z");

describe("Telegram development initData generator", () => {
  it("generates initData accepted by the production validator", () => {
    const generated = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });

    expect(
      validateTelegramInitData(generated.initData, { botToken, now }),
    ).toMatchObject({
      authDate: new Date("2026-09-05T12:34:56.000Z"),
      user: {
        id: BigInt(DEV_TELEGRAM_USER.id),
        firstName: DEV_TELEGRAM_USER.first_name,
        lastName: DEV_TELEGRAM_USER.last_name,
        username: DEV_TELEGRAM_USER.username,
        languageCode: DEV_TELEGRAM_USER.language_code,
      },
    });
  });

  it("rejects tampering with generated user payload", () => {
    const generated = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });
    const tampered = generated.initData.replace("dev_user", "other_user");

    expect(() =>
      validateTelegramInitData(tampered, { botToken, now }),
    ).toThrow();
  });

  it("uses supplied current time for auth_date", () => {
    const generated = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });

    expect(generated.authDate).toBe(Math.floor(now.getTime() / 1000));
    expect(new URLSearchParams(generated.initData).get("auth_date")).toBe(
      String(generated.authDate),
    );
  });

  it("contains the expected development user", () => {
    const generated = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });
    const user = JSON.parse(
      new URLSearchParams(generated.initData).get("user") ?? "{}",
    ) as unknown;

    expect(user).toEqual(DEV_TELEGRAM_USER);
  });

  it("is deterministic for fixed token, payload, time, and query id", () => {
    const first = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });
    const second = generateTelegramDevInitData({
      botToken,
      now,
      queryId: "fixed-query",
    });

    expect(second.initData).toBe(first.initData);
  });

  it("refuses production execution", () => {
    expect(() => assertTelegramDevInitDataCanRun("production")).toThrow(
      "Refusing to generate Telegram development initData with NODE_ENV=production.",
    );
  });
});
