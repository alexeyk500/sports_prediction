import { createHmac } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run development seed with NODE_ENV=production.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const supportedCompetitions = [
  { code: "EPL", name: "Premier League" },
  { code: "LALIGA", name: "La Liga" },
  { code: "SERIE_A", name: "Serie A" },
];

const teams = [
  ["dev-arsenal", "Arsenal"],
  ["dev-chelsea", "Chelsea"],
  ["dev-barcelona", "Barcelona"],
  ["dev-valencia", "Valencia"],
  ["dev-milan", "Milan"],
  ["dev-roma", "Roma"],
];

try {
  const now = new Date();
  const businessDate = getBusinessDate(now);
  const range = getBusinessDayRangeUtc(businessDate);
  const kickoffTimes = [
    new Date(Math.max(now.getTime() + 60 * 60 * 1000, range.startUtc.getTime() + 12 * 60 * 60 * 1000)),
    new Date(Math.max(now.getTime() + 2 * 60 * 60 * 1000, range.startUtc.getTime() + 15 * 60 * 60 * 1000)),
    new Date(Math.max(now.getTime() + 3 * 60 * 60 * 1000, range.startUtc.getTime() + 18 * 60 * 60 * 1000)),
  ];

  await prisma.tournament.upsert({
    where: { number: 1 },
    update: {
      status: "ACTIVE",
      startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      prizePoolNanoTon: 0n,
    },
    create: {
      number: 1,
      status: "ACTIVE",
      startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      prizePoolNanoTon: 0n,
    },
  });

  for (const competition of supportedCompetitions) {
    await prisma.competition.upsert({
      where: { code: competition.code },
      update: { name: competition.name, isActive: true },
      create: {
        providerCompetitionId: `dev-${competition.code}`,
        code: competition.code,
        name: competition.name,
        isActive: true,
      },
    });
  }

  for (const [providerTeamId, name] of teams) {
    await prisma.team.upsert({
      where: { providerTeamId },
      update: { name },
      create: { providerTeamId, name },
    });
  }

  const [epl, laliga, serieA] = await Promise.all([
    prisma.competition.findUniqueOrThrow({ where: { code: "EPL" } }),
    prisma.competition.findUniqueOrThrow({ where: { code: "LALIGA" } }),
    prisma.competition.findUniqueOrThrow({ where: { code: "SERIE_A" } }),
  ]);
  const [arsenal, chelsea, barcelona, valencia, milan, roma] = await Promise.all(
    teams.map(([providerTeamId]) => prisma.team.findUniqueOrThrow({ where: { providerTeamId } })),
  );

  await upsertFixtureWithSnapshot({
    providerFixtureId: `dev-${businessDate}-epl-1`,
    competitionId: epl.id,
    homeTeamId: arsenal.id,
    awayTeamId: chelsea.id,
    kickoffAt: kickoffTimes[0],
    snapshot: {
      odds: ["2.000000", "3.500000", "4.000000"],
      probabilities: ["0.48275862", "0.27586207", "0.24137931"],
      points: [13, 24, 27],
    },
  });
  await upsertFixtureWithSnapshot({
    providerFixtureId: `dev-${businessDate}-laliga-1`,
    competitionId: laliga.id,
    homeTeamId: barcelona.id,
    awayTeamId: valencia.id,
    kickoffAt: kickoffTimes[1],
    snapshot: {
      odds: ["1.850000", "3.700000", "4.600000"],
      probabilities: ["0.52591463", "0.26295732", "0.21112805"],
      points: [12, 25, 31],
    },
  });
  await upsertFixtureWithSnapshot({
    providerFixtureId: `dev-${businessDate}-seriea-1`,
    competitionId: serieA.id,
    homeTeamId: milan.id,
    awayTeamId: roma.id,
    kickoffAt: kickoffTimes[2],
    snapshot: {
      odds: ["2.300000", "3.250000", "3.200000"],
      probabilities: ["0.41219839", "0.29124502", "0.29655659"],
      points: [16, 22, 22],
    },
  });

  console.log(`Development seed complete for London business date ${businessDate}.`);

  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log("Development initData:");
    console.log(
      signTelegramInitData({
        auth_date: String(Math.floor(Date.now() / 1000)),
        query_id: "dev-query",
        user: JSON.stringify({
          id: "1000000001",
          username: "dev_user",
          first_name: "Dev",
          language_code: "en",
        }),
      }, process.env.TELEGRAM_BOT_TOKEN),
    );
  }
} finally {
  await prisma.$disconnect();
}

async function upsertFixtureWithSnapshot(input) {
  const fixture = await prisma.fixture.upsert({
    where: { providerFixtureId: input.providerFixtureId },
    update: {
      competitionId: input.competitionId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      kickoffAt: input.kickoffAt,
    },
    create: {
      providerFixtureId: input.providerFixtureId,
      competitionId: input.competitionId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      kickoffAt: input.kickoffAt,
      status: "DRAFT",
    },
  });

  if (fixture.scoringSnapshotId) {
    await prisma.fixture.update({
      where: { id: fixture.id },
      data: { status: "OPEN" },
    });
    return;
  }

  const snapshot = await prisma.outcomeSnapshot.create({
    data: {
      fixtureId: fixture.id,
      homeRawOdds: new Prisma.Decimal(input.snapshot.odds[0]),
      drawRawOdds: new Prisma.Decimal(input.snapshot.odds[1]),
      awayRawOdds: new Prisma.Decimal(input.snapshot.odds[2]),
      homeProbability: new Prisma.Decimal(input.snapshot.probabilities[0]),
      drawProbability: new Prisma.Decimal(input.snapshot.probabilities[1]),
      awayProbability: new Prisma.Decimal(input.snapshot.probabilities[2]),
      homePoints: input.snapshot.points[0],
      drawPoints: input.snapshot.points[1],
      awayPoints: input.snapshot.points[2],
      snapshotAt: new Date(),
      scoringVersion: "v1",
    },
  });

  await prisma.fixture.update({
    where: { id: fixture.id },
    data: {
      scoringSnapshotId: snapshot.id,
      status: "OPEN",
    },
  });
}

function signTelegramInitData(fields, botToken) {
  const dataCheckString = Object.entries(fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(fields);

  params.set("hash", hash);

  return params.toString();
}

function getBusinessDate(instant) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant).map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getBusinessDayRangeUtc(businessDate) {
  const [year, month, day] = businessDate.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    startUtc: zonedLocalTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0 }),
    endUtc: zonedLocalTimeToUtc({
      year: nextDay.getUTCFullYear(),
      month: nextDay.getUTCMonth() + 1,
      day: nextDay.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    }),
  };
}

function zonedLocalTimeToUtc(localTime) {
  let utcTimestamp = Date.UTC(
    localTime.year,
    localTime.month - 1,
    localTime.day,
    localTime.hour,
    localTime.minute,
    localTime.second,
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const instant = new Date(utcTimestamp);
    const values = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(instant).map((part) => [part.type, part.value]),
    );
    const localAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const nextUtcTimestamp =
      Date.UTC(
        localTime.year,
        localTime.month - 1,
        localTime.day,
        localTime.hour,
        localTime.minute,
        localTime.second,
      ) -
      (localAsUtc - instant.getTime());

    if (nextUtcTimestamp === utcTimestamp) {
      break;
    }

    utcTimestamp = nextUtcTimestamp;
  }

  return new Date(utcTimestamp);
}
