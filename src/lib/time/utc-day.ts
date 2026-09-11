export type UtcDateKey = `${number}-${number}-${number}`;

export interface UtcDayRange {
  startUtc: Date;
  endUtc: Date;
}

export function getUtcDateKey(instant: Date): UtcDateKey {
  assertValidDate(instant, "instant");

  return formatUtcDateKey({
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  });
}

export function getUtcDayRange(utcDateKey: UtcDateKey): UtcDayRange {
  const date = parseUtcDateKey(utcDateKey);

  return {
    startUtc: new Date(Date.UTC(date.year, date.month - 1, date.day)),
    endUtc: new Date(Date.UTC(date.year, date.month - 1, date.day + 1)),
  };
}

export function isInstantInUtcDate(
  instant: Date,
  utcDateKey: UtcDateKey,
): boolean {
  assertValidDate(instant, "instant");
  const { startUtc, endUtc } = getUtcDayRange(utcDateKey);
  const timestamp = instant.getTime();

  return timestamp >= startUtc.getTime() && timestamp < endUtc.getTime();
}

export function utcDateKeyToDatabaseDate(utcDateKey: UtcDateKey): Date {
  const date = parseUtcDateKey(utcDateKey);

  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

interface UtcDateParts {
  year: number;
  month: number;
  day: number;
}

function formatUtcDateKey({ year, month, day }: UtcDateParts): UtcDateKey {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as UtcDateKey;
}

function parseUtcDateKey(value: UtcDateKey): UtcDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("UTC date key must use YYYY-MM-DD format.");
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));

  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    throw new Error("UTC date key must be a valid calendar date.");
  }

  return { year, month, day };
}

function assertValidDate(value: Date, name: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`${name} must be a valid Date.`);
  }
}
