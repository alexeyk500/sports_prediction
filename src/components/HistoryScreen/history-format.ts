import { formatUtcDateKey } from "@/lib/i18n/format";
import type { SupportedLocale } from "@/lib/i18n/locales";
import type { useTranslation } from "@/lib/i18n/use-translation";

type Translator = ReturnType<typeof useTranslation>["t"];

export function formatHistoryDateRange(
  locale: SupportedLocale,
  startsAt: string,
  endsAt: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

export function formatHistoryDayTitle(
  t: Translator,
  locale: SupportedLocale,
  utcDateKey: string,
  currentUtcDateKey: string,
): string {
  const date = formatUtcDateKey(locale, utcDateKey);

  if (utcDateKey === currentUtcDateKey) {
    return t("history.day.today", { date });
  }

  if (utcDateKey === previousUtcDateKey(currentUtcDateKey)) {
    return t("history.day.yesterday", { date });
  }

  return date;
}

export function formatHistoryKickoff(
  locale: SupportedLocale,
  kickoffAt: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoffAt));
}

function previousUtcDateKey(utcDateKey: string): string {
  const [year, month, day] = utcDateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(Date.UTC(year, month - 1, day - 1, 12));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
