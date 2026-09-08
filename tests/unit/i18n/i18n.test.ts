import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import { formatKickoffTime, formatLocalizedNumber } from "@/lib/i18n/format";
import {
  coerceLocale,
  createTranslator,
  translationResources,
} from "@/lib/i18n/i18n";
import {
  directionForLocale,
  normalizeTelegramLanguageCode,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/locales";

describe("i18n", () => {
  it("keeps all dictionaries on the same translation contract", () => {
    const englishKeys = leafPaths(translationResources.en);

    for (const locale of SUPPORTED_LOCALES) {
      expect(leafPaths(translationResources[locale])).toEqual(englishKeys);
    }
  });

  it("falls back to the default locale for unsupported values", () => {
    expect(coerceLocale("fr")).toBe("en");
    expect(coerceLocale(null)).toBe("en");
  });

  it("translates known keys for all supported locales", () => {
    expect(createTranslator("en")("profile.settingsTitle")).toBe("Settings");
    expect(createTranslator("ru")("profile.settingsTitle")).toBe("Настройки");
    expect(createTranslator("de")("profile.settingsTitle")).toBe(
      "Einstellungen",
    );
    expect(createTranslator("es")("profile.settingsTitle")).toBe("Ajustes");
    expect(createTranslator("ar")("profile.settingsTitle")).toBe("الإعدادات");
  });

  it("interpolates dynamic values without string concatenation", () => {
    expect(
      createTranslator("en")("matches.quota.free", { used: 2, limit: 3 }),
    ).toBe("Free predictions: 2 / 3");
    expect(
      createTranslator("ar")("common.userFallback", { id: "900000001" }),
    ).toBe("مستخدم 900000001");
  });

  it("normalizes Telegram language codes for initial locale", () => {
    expect(normalizeTelegramLanguageCode("ru")).toBe("ru");
    expect(normalizeTelegramLanguageCode("ru-RU")).toBe("ru");
    expect(normalizeTelegramLanguageCode("es_419")).toBe("es");
    expect(normalizeTelegramLanguageCode("fr")).toBe("en");
  });

  it("uses RTL only for Arabic", () => {
    expect(directionForLocale("ar")).toBe("rtl");
    expect(directionForLocale("en")).toBe("ltr");
    expect(directionForLocale("ru")).toBe("ltr");
    expect(directionForLocale("de")).toBe("ltr");
    expect(directionForLocale("es")).toBe("ltr");
  });

  it("formats user-facing numbers with the active locale", () => {
    expect(formatLocalizedNumber("en", 1234)).toBe("1,234");
    expect(formatLocalizedNumber("de", 1234)).toBe("1.234");
    expect(formatLocalizedNumber("ar", 12)).toMatch(/\S+/);
  });

  it("formats kickoff time with the active locale", () => {
    const kickoffAt = "2026-09-06T18:30:00.000Z";

    expect(formatKickoffTime("en", kickoffAt, { timeZone: "UTC" })).toMatch(
      /06|6/,
    );
    expect(formatKickoffTime("ru", kickoffAt, { timeZone: "UTC" })).not.toBe(
      formatKickoffTime("en", kickoffAt, { timeZone: "UTC" }),
    );
  });

  it("maps known API errors to localized user-facing messages", () => {
    const error = new ApiClientError(
      {
        code: "PREDICTION_LOCKED",
        message: "Prediction is locked.",
        details: {},
      },
      423,
      "/api/predictions/prediction-1",
    );

    expect(messageForApiError(error, "en", { includeDiagnostics: false })).toBe(
      "This match has started.",
    );
    expect(messageForApiError(error, "ru", { includeDiagnostics: false })).toBe(
      "Матч уже начался.",
    );
  });

  it("maps unknown API errors to the localized generic message", () => {
    const error = new ApiClientError(
      { code: "SOME_INTERNAL_CODE", message: "Internal detail.", details: {} },
      500,
      "/api/bootstrap",
    );

    expect(messageForApiError(error, "es", { includeDiagnostics: false })).toBe(
      "Algo salió mal.",
    );
  });
});

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, nested]) =>
      leafPaths(nested, prefix ? `${prefix}.${key}` : key),
    )
    .sort();
}
