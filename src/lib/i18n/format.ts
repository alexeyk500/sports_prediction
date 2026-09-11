import type { SupportedLocale } from "./locales";

export function formatLocalizedNumber(
  locale: SupportedLocale,
  value: number,
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatKickoffTime(
  locale: SupportedLocale,
  kickoffAt: string,
  options: { timeZone?: string } = {},
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: options.timeZone,
  }).format(new Date(kickoffAt));
}

export function formatUtcDateKey(
  locale: SupportedLocale,
  utcDateKey: string,
): string {
  const [year, month, day] = utcDateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return utcDateKey;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
