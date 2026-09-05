import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  calculatePredictionPointsCore,
  normalizeOneXTwoOddsCore,
  quantizeProbabilityCore,
  quantizeRawOddsCore,
  SCORING_VERSION,
} from "../src/modules/predictions/scoring.core.ts";

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
  { code: "BUNDESLIGA", name: "Bundesliga" },
  { code: "LIGUE_1", name: "Ligue 1" },
  { code: "UCL", name: "UEFA Champions League" },
  { code: "UEL", name: "UEFA Europa League" },
];

const teams = [
  ["dev-arsenal", "Arsenal"],
  ["dev-chelsea", "Chelsea"],
  ["dev-barcelona", "Barcelona"],
  ["dev-valencia", "Valencia"],
  ["dev-milan", "Milan"],
  ["dev-roma", "Roma"],
  ["dev-bayern", "Bayern Munich"],
  ["dev-dortmund", "Dortmund"],
  ["dev-psg", "Paris SG"],
  ["dev-lyon", "Lyon"],
  ["dev-inter", "Inter"],
  ["dev-napoli", "Napoli"],
  ["dev-atletico", "Atletico Madrid"],
  ["dev-sevilla", "Sevilla"],
  ["dev-leverkusen", "Leverkusen"],
  ["dev-leipzig", "Leipzig"],
  ["dev-marseille", "Marseille"],
  ["dev-lille", "Lille"],
  ["dev-benfica", "Benfica"],
  ["dev-ajax", "Ajax"],
];

try {
  const now = new Date();
  const businessDate = getBusinessDate(now);
  const range = getBusinessDayRangeUtc(businessDate);
  const kickoffTimes = createSeedKickoffTimes(now, range, 10);

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

  const competitionsByCode = new Map(
    await Promise.all(
      supportedCompetitions.map(async (competition) => [
        competition.code,
        await prisma.competition.findUniqueOrThrow({ where: { code: competition.code } }),
      ]),
    ),
  );
  const teamsByProviderId = new Map(
    await Promise.all(
      teams.map(async ([providerTeamId]) => [
        providerTeamId,
        await prisma.team.findUniqueOrThrow({ where: { providerTeamId } }),
      ]),
    ),
  );

  const fixtureDefinitions = buildFixtureDefinitions(businessDate, kickoffTimes);
  await archiveObsoleteDevelopmentFixtures({
    businessDate,
    currentProviderFixtureIds: fixtureDefinitions.map((fixture) => fixture.providerFixtureId),
    previousDayKickoffAt: new Date(range.startUtc.getTime() - 60 * 60 * 1000),
  });

  const seededFixtures = [];

  for (const fixtureDefinition of fixtureDefinitions) {
    const competition = competitionsByCode.get(fixtureDefinition.competitionCode);
    const homeTeam = teamsByProviderId.get(fixtureDefinition.homeTeamProviderId);
    const awayTeam = teamsByProviderId.get(fixtureDefinition.awayTeamProviderId);

    if (!competition || !homeTeam || !awayTeam) {
      throw new Error(`Seed definition references missing competition/team: ${fixtureDefinition.providerFixtureId}`);
    }

    const seededFixture = await upsertFixtureWithSnapshot({
      ...fixtureDefinition,
      competitionId: competition.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    });

    seededFixtures.push({
      ...seededFixture,
      competitionName: competition.name,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
    });
  }

  console.log(`Development seed complete for London business date ${businessDate}.`);
  console.table(
    seededFixtures.map((fixture) => ({
      fixture: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
      competition: fixture.competitionName,
      kickoffAt: fixture.kickoffAt.toISOString(),
      odds: fixture.odds.join(" / "),
      probabilities: fixture.probabilities.join(" / "),
      points: fixture.points.join(" / "),
    })),
  );
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
    const [updatedFixture, existingSnapshot] = await Promise.all([
      prisma.fixture.update({
        where: { id: fixture.id },
        data: { status: "OPEN" },
      }),
      prisma.outcomeSnapshot.findUniqueOrThrow({
        where: { id: fixture.scoringSnapshotId },
      }),
    ]);

    return buildSeededFixtureSummary(updatedFixture, existingSnapshot);
  }

  const calculatedSnapshot = calculateSnapshot(input.odds);
  const snapshot = await prisma.outcomeSnapshot.create({
    data: {
      fixtureId: fixture.id,
      homeRawOdds: calculatedSnapshot.rawOdds.home,
      drawRawOdds: calculatedSnapshot.rawOdds.draw,
      awayRawOdds: calculatedSnapshot.rawOdds.away,
      homeProbability: calculatedSnapshot.probabilities.home,
      drawProbability: calculatedSnapshot.probabilities.draw,
      awayProbability: calculatedSnapshot.probabilities.away,
      homePoints: calculatedSnapshot.points.home,
      drawPoints: calculatedSnapshot.points.draw,
      awayPoints: calculatedSnapshot.points.away,
      snapshotAt: new Date(),
      scoringVersion: SCORING_VERSION,
    },
  });

  const updatedFixture = await prisma.fixture.update({
    where: { id: fixture.id },
    data: {
      scoringSnapshotId: snapshot.id,
      status: "OPEN",
    },
  });

  return buildSeededFixtureSummary(updatedFixture, snapshot);
}

function buildFixtureDefinitions(businessDate, kickoffTimes) {
  return [
    {
      providerFixtureId: `dev-${businessDate}-predict-01`,
      competitionCode: "EPL",
      homeTeamProviderId: "dev-arsenal",
      awayTeamProviderId: "dev-chelsea",
      kickoffAt: kickoffTimes[0],
      odds: ["1.700000", "4.100000", "5.400000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-02`,
      competitionCode: "LALIGA",
      homeTeamProviderId: "dev-valencia",
      awayTeamProviderId: "dev-barcelona",
      kickoffAt: kickoffTimes[1],
      odds: ["5.200000", "4.000000", "1.720000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-03`,
      competitionCode: "SERIE_A",
      homeTeamProviderId: "dev-milan",
      awayTeamProviderId: "dev-roma",
      kickoffAt: kickoffTimes[2],
      odds: ["2.650000", "3.250000", "2.750000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-04`,
      competitionCode: "BUNDESLIGA",
      homeTeamProviderId: "dev-bayern",
      awayTeamProviderId: "dev-dortmund",
      kickoffAt: kickoffTimes[3],
      odds: ["1.250000", "6.200000", "11.000000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-05`,
      competitionCode: "LIGUE_1",
      homeTeamProviderId: "dev-lyon",
      awayTeamProviderId: "dev-marseille",
      kickoffAt: kickoffTimes[4],
      odds: ["2.950000", "2.750000", "3.050000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-06`,
      competitionCode: "UCL",
      homeTeamProviderId: "dev-inter",
      awayTeamProviderId: "dev-napoli",
      kickoffAt: kickoffTimes[5],
      odds: ["2.200000", "3.800000", "2.200000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-07`,
      competitionCode: "UEL",
      homeTeamProviderId: "dev-lille",
      awayTeamProviderId: "dev-benfica",
      kickoffAt: kickoffTimes[6],
      odds: ["6.800000", "4.600000", "1.480000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-08`,
      competitionCode: "EPL",
      homeTeamProviderId: "dev-chelsea",
      awayTeamProviderId: "dev-ajax",
      kickoffAt: kickoffTimes[7],
      odds: ["1.420000", "5.000000", "8.500000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-09`,
      competitionCode: "BUNDESLIGA",
      homeTeamProviderId: "dev-leverkusen",
      awayTeamProviderId: "dev-leipzig",
      kickoffAt: kickoffTimes[8],
      odds: ["2.800000", "3.200000", "2.800000"],
    },
    {
      providerFixtureId: `dev-${businessDate}-predict-10`,
      competitionCode: "UCL",
      homeTeamProviderId: "dev-atletico",
      awayTeamProviderId: "dev-sevilla",
      kickoffAt: kickoffTimes[9],
      odds: ["2.050000", "3.550000", "3.700000"],
    },
  ];
}

async function archiveObsoleteDevelopmentFixtures(input) {
  await prisma.fixture.updateMany({
    where: {
      providerFixtureId: {
        startsWith: `dev-${input.businessDate}-`,
        notIn: input.currentProviderFixtureIds,
      },
    },
    data: {
      kickoffAt: input.previousDayKickoffAt,
    },
  });
}

function calculateSnapshot(odds) {
  const rawOdds = {
    home: quantizeRawOddsCore(odds[0]),
    draw: quantizeRawOddsCore(odds[1]),
    away: quantizeRawOddsCore(odds[2]),
  };
  const normalized = normalizeOneXTwoOddsCore(rawOdds);
  const probabilities = {
    home: quantizeProbabilityCore(normalized.home),
    draw: quantizeProbabilityCore(normalized.draw),
    away: quantizeProbabilityCore(normalized.away),
  };

  return {
    rawOdds,
    probabilities,
    points: {
      home: calculatePredictionPointsCore(probabilities.home),
      draw: calculatePredictionPointsCore(probabilities.draw),
      away: calculatePredictionPointsCore(probabilities.away),
    },
  };
}

function buildSeededFixtureSummary(fixture, snapshot) {
  return {
    kickoffAt: fixture.kickoffAt,
    odds: [
      snapshot.homeRawOdds.toFixed(6),
      snapshot.drawRawOdds.toFixed(6),
      snapshot.awayRawOdds.toFixed(6),
    ],
    probabilities: [
      snapshot.homeProbability.toFixed(8),
      snapshot.drawProbability.toFixed(8),
      snapshot.awayProbability.toFixed(8),
    ],
    points: [snapshot.homePoints, snapshot.drawPoints, snapshot.awayPoints],
  };
}

function createSeedKickoffTimes(now, range, count) {
  const minimumLeadMs = 15 * 60 * 1000;
  const latestKickoff = range.endUtc.getTime() - 5 * 60 * 1000;
  const earliestKickoff = Math.max(now.getTime() + minimumLeadMs, range.startUtc.getTime() + 12 * 60 * 60 * 1000);

  if (earliestKickoff >= latestKickoff) {
    const fallbackStart = Math.max(now.getTime() + 60 * 1000, range.startUtc.getTime());
    const fallbackEnd = range.endUtc.getTime() - 1000;

    if (fallbackStart >= fallbackEnd) {
      return Array.from({ length: count }, (_, index) => new Date(range.endUtc.getTime() - (count - index) * 1000));
    }

    return spreadTimes(fallbackStart, fallbackEnd, count);
  }

  return spreadTimes(earliestKickoff, latestKickoff, count);
}

function spreadTimes(startMs, endMs, count) {
  if (count === 1) {
    return [new Date(startMs)];
  }

  const stepMs = Math.max(1, Math.floor((endMs - startMs) / (count - 1)));

  return Array.from({ length: count }, (_, index) => new Date(startMs + stepMs * index));
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
