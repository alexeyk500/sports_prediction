export const SUPPORTED_LOCALES = ["en", "ru", "de", "es", "ar"] as const;
export const DEFAULT_LOCALE = "en";

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type LocaleDirection = "ltr" | "rtl";

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && supportedLocaleSet.has(value);
}

export function normalizeTelegramLanguageCode(
  languageCode: string | null | undefined,
): SupportedLocale {
  if (!languageCode) {
    return DEFAULT_LOCALE;
  }

  const primaryLanguage = languageCode.trim().toLowerCase().split(/[-_]/)[0];

  return isSupportedLocale(primaryLanguage) ? primaryLanguage : DEFAULT_LOCALE;
}

export function directionForLocale(locale: SupportedLocale): LocaleDirection {
  return locale === "ar" ? "rtl" : "ltr";
}
