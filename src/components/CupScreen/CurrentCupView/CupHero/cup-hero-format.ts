import { formatLocalizedNumber } from "@/lib/i18n/format";
import type { SupportedLocale } from "@/lib/i18n/locales";
import type { useTranslation } from "@/lib/i18n/use-translation";

const NANO_TON_PER_TON = 1_000_000_000n;

export function formatDateRange(
  locale: SupportedLocale,
  startsAt: string,
  endsAt: string,
  timeZone: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });

  return formatter.formatRange(new Date(startsAt), new Date(endsAt));
}

export function formatEndDate(
  locale: SupportedLocale,
  endsAt: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(endsAt));
}

export function formatCountdown(
  t: ReturnType<typeof useTranslation>["t"],
  remainingMs: number,
): string {
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  return t("cup.countdown", { days, hours, minutes });
}

export function formatNanoTon(locale: SupportedLocale, value: string): string {
  const nanoTon = BigInt(value);
  const whole = nanoTon / NANO_TON_PER_TON;
  const fraction = nanoTon % NANO_TON_PER_TON;
  const wholeText =
    whole <= BigInt(Number.MAX_SAFE_INTEGER)
      ? formatLocalizedNumber(locale, Number(whole))
      : whole.toString();

  if (fraction === 0n) {
    return `${wholeText} TON`;
  }

  const fractionText = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return `${wholeText}.${fractionText} TON`;
}
