export const BUSINESS_TIMEZONE = "Europe/London";

export type BusinessDate = `${number}-${number}-${number}`;

const londonDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const londonDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export interface BusinessDayRangeUtc {
  startUtc: Date;
  endUtc: Date;
}

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

interface LocalDateTimeParts extends LocalDateParts {
  hour: number;
  minute: number;
  second: number;
}

export function getBusinessDate(instant: Date): BusinessDate {
  assertValidDate(instant, "instant");
  const parts = getLocalDateParts(instant);
  return formatBusinessDate(parts);
}

export function isInstantInBusinessDate(instant: Date, businessDate: BusinessDate): boolean {
  assertValidDate(instant, "instant");
  const { startUtc, endUtc } = getBusinessDayRangeUtc(businessDate);
  const timestamp = instant.getTime();

  return timestamp >= startUtc.getTime() && timestamp < endUtc.getTime();
}

export function getBusinessDayRangeUtc(businessDate: BusinessDate): BusinessDayRangeUtc {
  const localDate = parseBusinessDate(businessDate);
  const nextLocalDate = addDays(localDate, 1);

  return {
    startUtc: zonedLocalTimeToUtc({ ...localDate, hour: 0, minute: 0, second: 0 }),
    endUtc: zonedLocalTimeToUtc({ ...nextLocalDate, hour: 0, minute: 0, second: 0 }),
  };
}

function zonedLocalTimeToUtc(localTime: LocalDateTimeParts): Date {
  let utcTimestamp = Date.UTC(
    localTime.year,
    localTime.month - 1,
    localTime.day,
    localTime.hour,
    localTime.minute,
    localTime.second,
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimeZoneOffsetMilliseconds(new Date(utcTimestamp));
    const nextUtcTimestamp =
      Date.UTC(
        localTime.year,
        localTime.month - 1,
        localTime.day,
        localTime.hour,
        localTime.minute,
        localTime.second,
      ) - offset;

    if (nextUtcTimestamp === utcTimestamp) {
      break;
    }

    utcTimestamp = nextUtcTimestamp;
  }

  return new Date(utcTimestamp);
}

function getTimeZoneOffsetMilliseconds(instant: Date): number {
  const parts = getLocalDateTimeParts(instant);
  const localAsUtcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtcTimestamp - instant.getTime();
}

function getLocalDateParts(instant: Date): LocalDateParts {
  const values = Object.fromEntries(
    londonDateFormatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getLocalDateTimeParts(instant: Date): LocalDateTimeParts {
  const values = Object.fromEntries(
    londonDateTimeFormatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function formatBusinessDate({ year, month, day }: LocalDateParts): BusinessDate {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as BusinessDate;
}

function parseBusinessDate(value: BusinessDate): LocalDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Business date must use YYYY-MM-DD format.");
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
    throw new Error("Business date must be a valid calendar date.");
  }

  return { year, month, day };
}

function addDays(date: LocalDateParts, days: number): LocalDateParts {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + days));

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function assertValidDate(value: Date, name: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`${name} must be a valid Date.`);
  }
}
