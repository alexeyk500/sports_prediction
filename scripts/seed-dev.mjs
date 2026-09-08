import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
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
  { code: "EPL", name: "Premier League", apiFootballLeagueId: 39 },
  { code: "LALIGA", name: "La Liga", apiFootballLeagueId: 140 },
  { code: "SERIE_A", name: "Serie A", apiFootballLeagueId: 135 },
  { code: "BUNDESLIGA", name: "Bundesliga", apiFootballLeagueId: 78 },
  { code: "LIGUE_1", name: "Ligue 1", apiFootballLeagueId: 61 },
  { code: "UCL", name: "UEFA Champions League", apiFootballLeagueId: 2 },
  { code: "UEL", name: "UEFA Europa League", apiFootballLeagueId: 3 },
];

const teams = [
  { providerTeamId: "dev-arsenal", name: "Arsenal", apiFootballTeamId: 42 },
  { providerTeamId: "dev-chelsea", name: "Chelsea", apiFootballTeamId: 49 },
  {
    providerTeamId: "dev-barcelona",
    name: "Barcelona",
    apiFootballTeamId: 529,
  },
  { providerTeamId: "dev-valencia", name: "Valencia", apiFootballTeamId: 532 },
  { providerTeamId: "dev-milan", name: "Milan", apiFootballTeamId: 489 },
  { providerTeamId: "dev-roma", name: "Roma", apiFootballTeamId: 497 },
  {
    providerTeamId: "dev-bayern",
    name: "Bayern Munich",
    apiFootballTeamId: 157,
  },
  { providerTeamId: "dev-dortmund", name: "Dortmund", apiFootballTeamId: 165 },
  { providerTeamId: "dev-psg", name: "Paris SG", apiFootballTeamId: 85 },
  { providerTeamId: "dev-lyon", name: "Lyon", apiFootballTeamId: 80 },
  { providerTeamId: "dev-inter", name: "Inter", apiFootballTeamId: 505 },
  { providerTeamId: "dev-napoli", name: "Napoli", apiFootballTeamId: 492 },
  {
    providerTeamId: "dev-atletico",
    name: "Atletico Madrid",
    apiFootballTeamId: 530,
  },
  { providerTeamId: "dev-sevilla", name: "Sevilla", apiFootballTeamId: 536 },
  {
    providerTeamId: "dev-leverkusen",
    name: "Leverkusen",
    apiFootballTeamId: 168,
  },
  { providerTeamId: "dev-leipzig", name: "Leipzig", apiFootballTeamId: 173 },
  { providerTeamId: "dev-marseille", name: "Marseille", apiFootballTeamId: 81 },
  { providerTeamId: "dev-lille", name: "Lille", apiFootballTeamId: 79 },
  { providerTeamId: "dev-benfica", name: "Benfica", apiFootballTeamId: 211 },
  { providerTeamId: "dev-ajax", name: "Ajax", apiFootballTeamId: 194 },
];

const assetManifest = loadAssetManifest();
const competitionSlugsByApiFootballId = new Map(
  assetManifest.competitions.map((competition) => [
    competition.providerLeagueId,
    competition.slug,
  ]),
);
const teamSlugsByApiFootballId = new Map(
  assetManifest.teams.map((team) => [team.providerTeamId, team.slug]),
);

const requestedLeaderboardSize = parseDevLeaderboardSize(
  process.env.DEV_SEED_LEADERBOARD_SIZE,
);

const baseDevPlayers = [
  {
    telegramUserId: 900000001n,
    username: "dev_user",
    firstName: "Dev",
    lastName: "User",
    languageCode: "en",
    targetPoints: 38,
  },
  {
    telegramUserId: 900100001n,
    username: "GoalHunter",
    firstName: "Max",
    lastName: "Volkov",
    languageCode: "en",
    targetPoints: 65,
  },
  {
    telegramUserId: 900100002n,
    username: "footking",
    firstName: "Leo",
    lastName: "Morgan",
    languageCode: "en",
    targetPoints: 64,
  },
  {
    telegramUserId: 900100003n,
    username: "Nikita88",
    firstName: "Nikita",
    lastName: "Sokolov",
    languageCode: "ru",
    targetPoints: 61,
  },
  {
    telegramUserId: 900100004n,
    username: "AlexR",
    firstName: "Alex",
    lastName: "Reed",
    languageCode: "en",
    targetPoints: 58,
  },
  {
    telegramUserId: 900100005n,
    username: "Toni",
    firstName: "Toni",
    lastName: "Keller",
    languageCode: "de",
    targetPoints: 55,
  },
  {
    telegramUserId: 900100006n,
    username: "viktor_k",
    firstName: "Viktor",
    lastName: "Karpov",
    languageCode: "ru",
    targetPoints: 52,
  },
  {
    telegramUserId: 900100007n,
    username: "footballist",
    firstName: "Marco",
    lastName: "Rossi",
    languageCode: "en",
    targetPoints: 49,
  },
  {
    telegramUserId: 900100008n,
    username: "Roman",
    firstName: "Roman",
    lastName: "Petrov",
    languageCode: "ru",
    targetPoints: 46,
  },
  {
    telegramUserId: 900100009n,
    username: "pitchmind",
    firstName: "Oliver",
    lastName: "Stone",
    languageCode: "en",
    targetPoints: 43,
  },
  {
    telegramUserId: 900100010n,
    username: "MaxBet",
    firstName: "Maksim",
    lastName: "Orlov",
    languageCode: "ru",
    targetPoints: 40,
  },
  {
    telegramUserId: 900100011n,
    username: "crossbar",
    firstName: "Ethan",
    lastName: "Brooks",
    languageCode: "en",
    targetPoints: 38,
  },
  {
    telegramUserId: 900100012n,
    username: "netfinder",
    firstName: "Jonas",
    lastName: "Weber",
    languageCode: "de",
    targetPoints: 36,
  },
  {
    telegramUserId: 900100013n,
    username: "LaMasiaFan",
    firstName: "Diego",
    lastName: "Navarro",
    languageCode: "es",
    targetPoints: 35,
  },
  {
    telegramUserId: 900100014n,
    username: "northstand",
    firstName: "Harry",
    lastName: "Mason",
    languageCode: "en",
    targetPoints: 33,
  },
  {
    telegramUserId: 900100015n,
    username: "ultra_m",
    firstName: "Milan",
    lastName: "Horvat",
    languageCode: "en",
    targetPoints: 31,
  },
  {
    telegramUserId: 900100016n,
    username: "keeper01",
    firstName: "Sam",
    lastName: "Foster",
    languageCode: "en",
    targetPoints: 30,
  },
  {
    telegramUserId: 900100017n,
    username: "derbyday",
    firstName: "Pablo",
    lastName: "Santos",
    languageCode: "es",
    targetPoints: 29,
  },
  {
    telegramUserId: 900100018n,
    username: "halfspace",
    firstName: "Luca",
    lastName: "Bianchi",
    languageCode: "en",
    targetPoints: 27,
  },
  {
    telegramUserId: 900100019n,
    username: "pressingPro",
    firstName: "Felix",
    lastName: "Hartmann",
    languageCode: "de",
    targetPoints: 25,
  },
  {
    telegramUserId: 900100020n,
    username: "awaydays",
    firstName: "Ben",
    lastName: "Carter",
    languageCode: "en",
    targetPoints: 24,
  },
  {
    telegramUserId: 900100021n,
    username: "xGbrain",
    firstName: "Ivan",
    lastName: "Morozov",
    languageCode: "ru",
    targetPoints: 23,
  },
  {
    telegramUserId: 900100022n,
    username: "tinytackle",
    firstName: "Noah",
    lastName: "Ward",
    languageCode: "en",
    targetPoints: 22,
  },
  {
    telegramUserId: 900100023n,
    username: "leftwinger",
    firstName: "Sergio",
    lastName: "Ruiz",
    languageCode: "es",
    targetPoints: 21,
  },
  {
    telegramUserId: 900100024n,
    username: "cornerkick",
    firstName: "Adam",
    lastName: "Nowak",
    languageCode: "en",
    targetPoints: 20,
  },
  {
    telegramUserId: 900100025n,
    username: "cleanSheet",
    firstName: "Daniel",
    lastName: "King",
    languageCode: "en",
    targetPoints: 19,
  },
  {
    telegramUserId: 900100026n,
    username: "kopite_m",
    firstName: "Mason",
    lastName: "Clark",
    languageCode: "en",
    targetPoints: 18,
  },
  {
    telegramUserId: 900100027n,
    username: "futbolero",
    firstName: "Carlos",
    lastName: "Mendez",
    languageCode: "es",
    targetPoints: 17,
  },
  {
    telegramUserId: 900100028n,
    username: "sweeper",
    firstName: "Owen",
    lastName: "Taylor",
    languageCode: "en",
    targetPoints: 16,
  },
  {
    telegramUserId: 900100029n,
    username: "gegenpress",
    firstName: "Moritz",
    lastName: "Bauer",
    languageCode: "de",
    targetPoints: 15,
  },
  {
    telegramUserId: 900100030n,
    username: "finalthird",
    firstName: "Tim",
    lastName: "Fischer",
    languageCode: "de",
    targetPoints: 14,
  },
  {
    telegramUserId: 900100031n,
    username: "no9",
    firstName: "Artem",
    lastName: "Egorov",
    languageCode: "ru",
    targetPoints: 13,
  },
  {
    telegramUserId: 900100032n,
    username: "zona14",
    firstName: "Miguel",
    lastName: "Torres",
    languageCode: "es",
    targetPoints: 12,
  },
  {
    telegramUserId: 900100033n,
    username: "box2box",
    firstName: "Chris",
    lastName: "Walker",
    languageCode: "en",
    targetPoints: 11,
  },
  {
    telegramUserId: 900100034n,
    username: "stoppage",
    firstName: "Daniil",
    lastName: "Smirnov",
    languageCode: "ru",
    targetPoints: 10,
  },
  {
    telegramUserId: 900100035n,
    username: "widePlay",
    firstName: "Luis",
    lastName: "Garcia",
    languageCode: "es",
    targetPoints: 9,
  },
  {
    telegramUserId: 900100036n,
    username: "overlap",
    firstName: "Jan",
    lastName: "Schmidt",
    languageCode: "de",
    targetPoints: 8,
  },
  {
    telegramUserId: 900100037n,
    username: "academy10",
    firstName: "Tom",
    lastName: "Hughes",
    languageCode: "en",
    targetPoints: 7,
  },
  {
    telegramUserId: 900100038n,
    username: "deepblock",
    firstName: "Kirill",
    lastName: "Lebedev",
    languageCode: "ru",
    targetPoints: 7,
  },
  {
    telegramUserId: 900100039n,
    username: "touchline",
    firstName: "Hugo",
    lastName: "Martin",
    languageCode: "en",
    targetPoints: 6,
  },
  {
    telegramUserId: 900100040n,
    username: "setpiece",
    firstName: "Rafael",
    lastName: "Silva",
    languageCode: "es",
    targetPoints: 6,
  },
  {
    telegramUserId: 900100041n,
    username: "false9",
    firstName: "Anton",
    lastName: "Fedorov",
    languageCode: "ru",
    targetPoints: 5,
  },
  {
    telegramUserId: 900100042n,
    username: "lowCross",
    firstName: "Jack",
    lastName: "Evans",
    languageCode: "en",
    targetPoints: 5,
  },
  {
    telegramUserId: 900100043n,
    username: "mezzala",
    firstName: "Enzo",
    lastName: "Ricci",
    languageCode: "en",
    targetPoints: 4,
  },
  {
    telegramUserId: 900100044n,
    username: "topbins",
    firstName: "Oscar",
    lastName: "Hill",
    languageCode: "en",
    targetPoints: 4,
  },
  {
    telegramUserId: 900100045n,
    username: "pressTrap",
    firstName: "Amir",
    lastName: "Khan",
    languageCode: "en",
    targetPoints: 3,
  },
  {
    telegramUserId: 900100046n,
    username: "sideoverload",
    firstName: "Ilya",
    lastName: "Kuznetsov",
    languageCode: "ru",
    targetPoints: 2,
  },
  {
    telegramUserId: 900100047n,
    username: "volley",
    firstName: "Mateo",
    lastName: "Lopez",
    languageCode: "es",
    targetPoints: 1,
  },
  {
    telegramUserId: 900100048n,
    username: "tapin",
    firstName: "George",
    lastName: "Moore",
    languageCode: "en",
    targetPoints: 0,
  },
  {
    telegramUserId: 900100049n,
    username: "lateRun",
    firstName: "Ahmed",
    lastName: "Hassan",
    languageCode: "ar",
    targetPoints: 0,
  },
];

const devPlayers = buildDevPlayers(baseDevPlayers, requestedLeaderboardSize);

try {
  const now = new Date();
  const businessDate = getBusinessDate(now);
  const range = getBusinessDayRangeUtc(businessDate);
  const kickoffTimes = createSeedKickoffTimes(now, range, 6);
  const cupStartsAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const cupEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const tournament = await prisma.tournament.upsert({
    where: { number: 1 },
    update: {
      status: "ACTIVE",
      startsAt: cupStartsAt,
      endsAt: cupEndsAt,
      prizePoolNanoTon: 10_000_000_000n,
      prizeCurrency: "USDT",
    },
    create: {
      number: 1,
      status: "ACTIVE",
      startsAt: cupStartsAt,
      endsAt: cupEndsAt,
      prizePoolNanoTon: 10_000_000_000n,
      prizeCurrency: "USDT",
    },
  });

  await prisma.prizeDistributionTier.deleteMany({
    where: { tournamentId: tournament.id },
  });
  await prisma.prizeDistributionTier.createMany({
    data: [
      {
        tournamentId: tournament.id,
        sortOrder: 1,
        fromRank: 1,
        toRank: 1,
        amount: "3",
      },
      {
        tournamentId: tournament.id,
        sortOrder: 2,
        fromRank: 2,
        toRank: 2,
        amount: "2",
      },
      {
        tournamentId: tournament.id,
        sortOrder: 3,
        fromRank: 3,
        toRank: 3,
        amount: "1",
      },
      {
        tournamentId: tournament.id,
        sortOrder: 4,
        fromRank: 4,
        toRank: 10,
        amount: "0.5",
      },
      {
        tournamentId: tournament.id,
        sortOrder: 5,
        fromRank: 11,
        toRank: 20,
        amount: "0.1",
      },
    ],
  });

  for (const competition of supportedCompetitions) {
    const slug = competitionSlugsByApiFootballId.get(
      competition.apiFootballLeagueId,
    );
    if (!slug) {
      throw new Error(
        `Missing asset slug for competition ${competition.name} (${competition.apiFootballLeagueId}).`,
      );
    }

    await prisma.competition.upsert({
      where: { code: competition.code },
      update: { name: competition.name, slug, isActive: true },
      create: {
        providerCompetitionId: `dev-${competition.code}`,
        code: competition.code,
        name: competition.name,
        slug,
        isActive: true,
      },
    });
  }

  for (const team of teams) {
    const slug = teamSlugsByApiFootballId.get(team.apiFootballTeamId);
    if (!slug) {
      throw new Error(
        `Missing asset slug for team ${team.name} (${team.apiFootballTeamId}).`,
      );
    }

    await prisma.team.upsert({
      where: { providerTeamId: team.providerTeamId },
      update: { name: team.name, slug },
      create: { providerTeamId: team.providerTeamId, name: team.name, slug },
    });
  }

  const competitionsByCode = new Map(
    await Promise.all(
      supportedCompetitions.map(async (competition) => [
        competition.code,
        await prisma.competition.findUniqueOrThrow({
          where: { code: competition.code },
        }),
      ]),
    ),
  );
  const teamsByProviderId = new Map(
    await Promise.all(
      teams.map(async (team) => [
        team.providerTeamId,
        await prisma.team.findUniqueOrThrow({
          where: { providerTeamId: team.providerTeamId },
        }),
      ]),
    ),
  );

  const devUsers = await upsertDevUsers();
  const fixtureDefinitions = buildFixtureDefinitions({
    businessDate,
    kickoffTimes,
    now,
  });
  await archiveObsoleteDevelopmentFixtures({
    businessDate,
    currentProviderFixtureIds: fixtureDefinitions.map(
      (fixture) => fixture.providerFixtureId,
    ),
    previousDayKickoffAt: new Date(range.startUtc.getTime() - 60 * 60 * 1000),
  });

  const seededFixtures = [];

  for (const fixtureDefinition of fixtureDefinitions) {
    const competition = competitionsByCode.get(
      fixtureDefinition.competitionCode,
    );
    const homeTeam = teamsByProviderId.get(
      fixtureDefinition.homeTeamProviderId,
    );
    const awayTeam = teamsByProviderId.get(
      fixtureDefinition.awayTeamProviderId,
    );

    if (!competition || !homeTeam || !awayTeam) {
      throw new Error(
        `Seed definition references missing competition/team: ${fixtureDefinition.providerFixtureId}`,
      );
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

  await cleanupSeedTournamentRows({
    tournamentId: tournament.id,
    activeUserIds: devUsers.map((user) => user.id),
  });

  await seedCupPredictions({
    tournamentId: tournament.id,
    users: devUsers,
    fixtures: seededFixtures,
    currentInstant: now,
  });

  const leaderboard = await recalculateTournamentParticipants(tournament.id);

  console.log(
    `Development seed complete for London business date ${businessDate}.`,
  );
  console.log(
    `Active Weekly Cup: ${tournament.startsAt.toISOString()} → ${tournament.endsAt.toISOString()}.`,
  );
  console.log(
    `Seeded ${devUsers.length} users, ${seededFixtures.length} fixtures and ${leaderboard.predictionCount} predictions.`,
  );
  console.table(
    seededFixtures.map((fixture) => ({
      fixture: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
      competition: fixture.competitionName,
      kickoffAt: fixture.kickoffAt.toISOString(),
      status: fixture.status,
      score:
        fixture.homeScore === null
          ? ""
          : `${fixture.homeScore}-${fixture.awayScore}`,
      odds: fixture.odds.join(" / "),
      probabilities: fixture.probabilities.join(" / "),
      points: fixture.points.join(" / "),
    })),
  );
  console.table(
    leaderboard.top10.map((row) => ({
      rank: row.rank,
      player: row.player,
      points: row.points,
      predictions: row.predictions,
      correct: row.correct,
      wrong: row.wrong,
    })),
  );
} finally {
  await prisma.$disconnect();
}

function loadAssetManifest() {
  try {
    return JSON.parse(
      readFileSync("data/football-assets.manifest.json", "utf8"),
    );
  } catch (error) {
    throw new Error(
      "Development seed requires data/football-assets.manifest.json to assign canonical asset slugs. Run npm run football:assets:manifest:build first.",
      { cause: error },
    );
  }
}

function parseDevLeaderboardSize(value) {
  if (!value) {
    return 50;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 50) {
    return 50;
  }

  return Math.min(parsed, 1_000);
}

function buildDevPlayers(players, requestedSize) {
  if (requestedSize <= players.length) {
    return players;
  }

  const extraPlayersNeeded = requestedSize - players.length;
  const extraPlayersAboveDevUser =
    requestedSize >= 1_000
      ? 788
      : Math.max(0, Math.floor(extraPlayersNeeded * 0.68));
  const firstNames = [
    "Kirill",
    "Elena",
    "Ruslan",
    "Andrey",
    "Tatyana",
    "Dmitry",
    "Marta",
    "Sergey",
    "Vlad",
    "Anya",
    "Anton",
    "Sofia",
    "Nikolai",
    "Irene",
    "Denis",
    "Yaroslav",
  ];
  const lastNames = [
    "Moroz",
    "Sokol",
    "Kravtsov",
    "Belova",
    "Smirnov",
    "Kane",
    "Costa",
    "Weiss",
    "Ivanov",
    "Petrova",
    "Miller",
    "Fomin",
  ];
  const usernameRoots = [
    "WestHamFan",
    "FCDragon",
    "Dimka77",
    "topcorner",
    "matchday",
    "ultraNorth",
    "goalwatch",
    "leftfooter",
    "pressZone",
    "awayStand",
    "boxrunner",
    "derbyPulse",
    "netstorm",
    "latewinner",
    "citybreak",
    "xGtempo",
  ];
  const locales = ["en", "ru", "de", "es"];
  const extraPlayers = [];

  for (let index = 0; index < extraPlayersNeeded; index += 1) {
    const sequence = index + 1;
    const isAboveDevUser = index < extraPlayersAboveDevUser;
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index * 3) % lastNames.length];
    const usernameRoot = usernameRoots[(index * 5) % usernameRoots.length];
    const targetPoints = isAboveDevUser
      ? 42 + (index % 12)
      : Math.max(0, 34 - (index % 34));

    extraPlayers.push({
      telegramUserId: 901000000n + BigInt(sequence),
      username: `${usernameRoot}_${String(sequence).padStart(3, "0")}`,
      firstName,
      lastName,
      languageCode: locales[index % locales.length],
      targetPoints,
    });
  }

  return [...players, ...extraPlayers];
}

async function upsertFixtureWithSnapshot(input) {
  const fixture = await prisma.fixture.upsert({
    where: { providerFixtureId: input.providerFixtureId },
    update: {
      competitionId: input.competitionId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      kickoffAt: input.kickoffAt,
      status: input.status,
      providerStatus: input.providerStatus ?? null,
      homeScore: input.homeScore ?? null,
      awayScore: input.awayScore ?? null,
      finalOutcome: input.finalOutcome ?? null,
    },
    create: {
      providerFixtureId: input.providerFixtureId,
      competitionId: input.competitionId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      kickoffAt: input.kickoffAt,
      status: input.status,
      providerStatus: input.providerStatus ?? null,
      homeScore: input.homeScore ?? null,
      awayScore: input.awayScore ?? null,
      finalOutcome: input.finalOutcome ?? null,
    },
  });

  if (fixture.scoringSnapshotId) {
    const [updatedFixture, existingSnapshot] = await Promise.all([
      prisma.fixture.update({
        where: { id: fixture.id },
        data: {
          status: input.status,
          providerStatus: input.providerStatus ?? null,
          homeScore: input.homeScore ?? null,
          awayScore: input.awayScore ?? null,
          finalOutcome: input.finalOutcome ?? null,
        },
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
      status: input.status,
      providerStatus: input.providerStatus ?? null,
      homeScore: input.homeScore ?? null,
      awayScore: input.awayScore ?? null,
      finalOutcome: input.finalOutcome ?? null,
    },
  });

  return buildSeededFixtureSummary(updatedFixture, snapshot);
}

function buildFixtureDefinitions({ businessDate, kickoffTimes, now }) {
  const pastFixtures = [
    [
      "01",
      -4,
      13,
      "EPL",
      "dev-arsenal",
      "dev-chelsea",
      ["1.700000", "4.100000", "5.400000"],
      2,
      0,
    ],
    [
      "02",
      -4,
      16,
      "LALIGA",
      "dev-valencia",
      "dev-barcelona",
      ["5.200000", "4.000000", "1.720000"],
      1,
      3,
    ],
    [
      "03",
      -4,
      19,
      "SERIE_A",
      "dev-milan",
      "dev-roma",
      ["2.650000", "3.250000", "2.750000"],
      1,
      1,
    ],
    [
      "04",
      -3,
      12,
      "BUNDESLIGA",
      "dev-bayern",
      "dev-dortmund",
      ["1.250000", "6.200000", "11.000000"],
      3,
      1,
    ],
    [
      "05",
      -3,
      15,
      "LIGUE_1",
      "dev-lyon",
      "dev-marseille",
      ["2.950000", "2.750000", "3.050000"],
      0,
      1,
    ],
    [
      "06",
      -3,
      18,
      "UCL",
      "dev-inter",
      "dev-napoli",
      ["2.200000", "3.800000", "2.200000"],
      2,
      2,
    ],
    [
      "07",
      -2,
      12,
      "UEL",
      "dev-lille",
      "dev-benfica",
      ["6.800000", "4.600000", "1.480000"],
      0,
      2,
    ],
    [
      "08",
      -2,
      15,
      "EPL",
      "dev-chelsea",
      "dev-ajax",
      ["1.420000", "5.000000", "8.500000"],
      2,
      0,
    ],
    [
      "09",
      -2,
      18,
      "BUNDESLIGA",
      "dev-leverkusen",
      "dev-leipzig",
      ["2.800000", "3.200000", "2.800000"],
      1,
      0,
    ],
    [
      "10",
      -2,
      20,
      "UCL",
      "dev-atletico",
      "dev-sevilla",
      ["2.050000", "3.550000", "3.700000"],
      1,
      1,
    ],
    [
      "11",
      -1,
      12,
      "SERIE_A",
      "dev-napoli",
      "dev-milan",
      ["2.250000", "3.300000", "3.300000"],
      2,
      1,
    ],
    [
      "12",
      -1,
      14,
      "LALIGA",
      "dev-barcelona",
      "dev-atletico",
      ["1.950000", "3.700000", "4.000000"],
      0,
      0,
    ],
    [
      "13",
      -1,
      16,
      "EPL",
      "dev-arsenal",
      "dev-leverkusen",
      ["1.900000", "3.900000", "4.100000"],
      2,
      2,
    ],
    [
      "14",
      -1,
      18,
      "LIGUE_1",
      "dev-psg",
      "dev-lille",
      ["1.520000", "4.500000", "6.400000"],
      4,
      1,
    ],
    [
      "15",
      -1,
      20,
      "UEL",
      "dev-benfica",
      "dev-ajax",
      ["2.150000", "3.600000", "3.350000"],
      1,
      2,
    ],
    [
      "16",
      -1,
      21,
      "BUNDESLIGA",
      "dev-dortmund",
      "dev-leipzig",
      ["2.450000", "3.650000", "2.850000"],
      3,
      2,
    ],
    [
      "17",
      0,
      9,
      "UCL",
      "dev-roma",
      "dev-inter",
      ["3.400000", "3.350000", "2.200000"],
      0,
      1,
    ],
    [
      "18",
      0,
      10,
      "EPL",
      "dev-chelsea",
      "dev-sevilla",
      ["1.880000", "3.650000", "4.400000"],
      2,
      1,
    ],
  ].map(
    ([
      id,
      dayOffset,
      hour,
      competitionCode,
      homeTeamProviderId,
      awayTeamProviderId,
      odds,
      homeScore,
      awayScore,
    ]) => ({
      providerFixtureId: `dev-cup-settled-${id}`,
      competitionCode,
      homeTeamProviderId,
      awayTeamProviderId,
      kickoffAt: createRelativeKickoff(now, dayOffset, hour),
      odds,
      status: "SETTLED",
      providerStatus: "FT",
      homeScore,
      awayScore,
      finalOutcome: finalOutcomeForScore(homeScore, awayScore),
    }),
  );

  const todayFixtures = [
    [
      "01",
      "EPL",
      "dev-arsenal",
      "dev-chelsea",
      ["1.700000", "4.100000", "5.400000"],
    ],
    [
      "02",
      "LALIGA",
      "dev-valencia",
      "dev-barcelona",
      ["5.200000", "4.000000", "1.720000"],
    ],
    [
      "03",
      "SERIE_A",
      "dev-milan",
      "dev-roma",
      ["2.650000", "3.250000", "2.750000"],
    ],
    [
      "04",
      "BUNDESLIGA",
      "dev-bayern",
      "dev-dortmund",
      ["1.250000", "6.200000", "11.000000"],
    ],
    [
      "05",
      "LIGUE_1",
      "dev-lyon",
      "dev-marseille",
      ["2.950000", "2.750000", "3.050000"],
    ],
    [
      "06",
      "UCL",
      "dev-inter",
      "dev-napoli",
      ["2.200000", "3.800000", "2.200000"],
    ],
  ].map(
    (
      [id, competitionCode, homeTeamProviderId, awayTeamProviderId, odds],
      index,
    ) => ({
      providerFixtureId: `dev-${businessDate}-predict-${id}`,
      competitionCode,
      homeTeamProviderId,
      awayTeamProviderId,
      kickoffAt: kickoffTimes[index],
      odds,
      status: "OPEN",
      providerStatus: "NS",
      homeScore: null,
      awayScore: null,
      finalOutcome: null,
    }),
  );

  return [...pastFixtures, ...todayFixtures];
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
    id: fixture.id,
    scoringSnapshotId: snapshot.id,
    kickoffAt: fixture.kickoffAt,
    status: fixture.status,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    finalOutcome: fixture.finalOutcome,
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
    snapshot,
  };
}

async function upsertDevUsers() {
  const users = [];

  for (const player of devPlayers) {
    const user = await prisma.user.upsert({
      where: { telegramUserId: player.telegramUserId },
      update: {
        username: player.username,
        firstName: player.firstName,
        lastName: player.lastName,
        languageCode: player.languageCode,
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        telegramUserId: player.telegramUserId,
        username: player.username,
        firstName: player.firstName,
        lastName: player.lastName,
        languageCode: player.languageCode,
      },
    });

    await prisma.ratingProfile.upsert({
      where: { userId: user.id },
      update: {
        rating: 1500 + Math.min(120, player.targetPoints * 2),
        league: player.targetPoints >= 50 ? "SILVER_III" : "UNRANKED",
        qualifiedCupsCount: player.targetPoints >= 35 ? 1 : 0,
      },
      create: {
        userId: user.id,
        rating: 1500 + Math.min(120, player.targetPoints * 2),
        league: player.targetPoints >= 50 ? "SILVER_III" : "UNRANKED",
        qualifiedCupsCount: player.targetPoints >= 35 ? 1 : 0,
      },
    });

    users.push({ ...player, id: user.id });
  }

  return users;
}

async function seedCupPredictions({
  tournamentId,
  users,
  fixtures,
  currentInstant,
}) {
  const settledFixtures = fixtures.filter(
    (fixture) => fixture.status === "SETTLED",
  );
  const openFixtures = fixtures.filter((fixture) => fixture.status === "OPEN");
  const userIds = users.map((user) => user.id);

  await prisma.prediction.deleteMany({
    where: {
      tournamentId,
      userId: { in: userIds },
    },
  });

  for (const [userIndex, user] of users.entries()) {
    const plan = buildPredictionPlan({
      user,
      userIndex,
      settledFixtures,
      openFixtures,
    });

    await prisma.tournamentParticipant.upsert({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        tournamentId,
        userId: user.id,
      },
    });

    for (const [predictionIndex, prediction] of plan.entries()) {
      const snapshot = prediction.fixture.snapshot;
      const values = snapshotValuesForOutcome(
        snapshot,
        prediction.selectedOutcome,
      );
      const isSettled = prediction.fixture.status === "SETTLED";
      const isCorrect =
        isSettled &&
        prediction.selectedOutcome === prediction.fixture.finalOutcome;
      const createdAt = new Date(
        prediction.fixture.kickoffAt.getTime() -
          (95 + predictionIndex * 7) * 60 * 1000,
      );

      await prisma.prediction.upsert({
        where: {
          userId_fixtureId: {
            userId: user.id,
            fixtureId: prediction.fixture.id,
          },
        },
        update: {
          tournamentId,
          outcomeSnapshotId: snapshot.id,
          selectedOutcome: prediction.selectedOutcome,
          slotType: prediction.slotType,
          probabilityAtPrediction: values.probability,
          potentialPoints: values.points,
          resultStatus: isSettled
            ? isCorrect
              ? "CORRECT"
              : "INCORRECT"
            : "PENDING",
          earnedPoints: isSettled && isCorrect ? values.points : 0,
          settledAt: isSettled
            ? new Date(
                prediction.fixture.kickoffAt.getTime() + 2 * 60 * 60 * 1000,
              )
            : null,
          createdAt,
        },
        create: {
          userId: user.id,
          tournamentId,
          fixtureId: prediction.fixture.id,
          outcomeSnapshotId: snapshot.id,
          selectedOutcome: prediction.selectedOutcome,
          slotType: prediction.slotType,
          probabilityAtPrediction: values.probability,
          potentialPoints: values.points,
          resultStatus: isSettled
            ? isCorrect
              ? "CORRECT"
              : "INCORRECT"
            : "PENDING",
          earnedPoints: isSettled && isCorrect ? values.points : 0,
          settledAt: isSettled
            ? new Date(
                prediction.fixture.kickoffAt.getTime() + 2 * 60 * 60 * 1000,
              )
            : null,
          createdAt,
        },
      });
    }

    await syncDailyUsageForUser(user.id, currentInstant);
  }
}

async function cleanupSeedTournamentRows({ tournamentId, activeUserIds }) {
  const seedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { telegramUserId: 900000001n },
        { telegramUserId: { gte: 900100001n, lte: 900100049n } },
        { telegramUserId: { gte: 901000001n, lte: 901001000n } },
      ],
    },
    select: { id: true },
  });
  const seedUserIds = seedUsers.map((user) => user.id);
  const activeUserIdSet = new Set(activeUserIds);
  const obsoleteUserIds = seedUserIds.filter(
    (userId) => !activeUserIdSet.has(userId),
  );

  await prisma.prediction.deleteMany({
    where: {
      tournamentId,
      userId: { in: seedUserIds },
    },
  });

  if (obsoleteUserIds.length > 0) {
    await prisma.tournamentParticipant.deleteMany({
      where: {
        tournamentId,
        userId: { in: obsoleteUserIds },
      },
    });
  }
}

function buildPredictionPlan({
  user,
  userIndex,
  settledFixtures,
  openFixtures,
}) {
  const correctFixtures = chooseCorrectFixturesForTarget(
    user.targetPoints,
    settledFixtures,
    userIndex,
  );
  const usedFixtureIds = new Set(correctFixtures.map((fixture) => fixture.id));
  const settledIncorrectCount = plannedSettledIncorrectCount(
    user.targetPoints,
    userIndex,
  );
  const todayPendingCount =
    user.telegramUserId === 900000001n
      ? 1
      : plannedTodayPendingCount(user.targetPoints, userIndex);
  const predictions = [];

  for (const fixture of correctFixtures) {
    predictions.push({
      fixture,
      selectedOutcome: fixture.finalOutcome,
    });
  }

  for (const fixture of rotate(settledFixtures, userIndex * 3)) {
    if (
      predictions.filter(
        (prediction) =>
          prediction.fixture.status === "SETTLED" &&
          prediction.selectedOutcome !== prediction.fixture.finalOutcome,
      ).length >= settledIncorrectCount
    ) {
      break;
    }

    if (usedFixtureIds.has(fixture.id)) {
      continue;
    }

    usedFixtureIds.add(fixture.id);
    predictions.push({
      fixture,
      selectedOutcome: firstIncorrectOutcome(
        fixture.finalOutcome,
        userIndex + predictions.length,
      ),
    });
  }

  for (const fixture of rotate(openFixtures, userIndex)) {
    if (
      predictions.filter((prediction) => prediction.fixture.status === "OPEN")
        .length >= todayPendingCount
    ) {
      break;
    }

    if (usedFixtureIds.has(fixture.id)) {
      continue;
    }

    usedFixtureIds.add(fixture.id);
    predictions.push({
      fixture,
      selectedOutcome: outcomeByIndex(userIndex + predictions.length),
    });
  }

  return assignDailySlotTypes(
    predictions.sort(
      (left, right) =>
        left.fixture.kickoffAt.getTime() - right.fixture.kickoffAt.getTime(),
    ),
  );
}

function assignDailySlotTypes(predictions) {
  const usageByBusinessDate = new Map();
  const result = [];

  for (const prediction of predictions) {
    const businessDate = getBusinessDate(prediction.fixture.kickoffAt);
    const usage = usageByBusinessDate.get(businessDate) ?? {
      freeUsed: 0,
      rewardedUsed: 0,
    };

    if (usage.freeUsed < 3) {
      usage.freeUsed += 1;
      usageByBusinessDate.set(businessDate, usage);
      result.push({ ...prediction, slotType: "FREE" });
      continue;
    }

    if (usage.rewardedUsed < 5) {
      usage.rewardedUsed += 1;
      usageByBusinessDate.set(businessDate, usage);
      result.push({ ...prediction, slotType: "REWARDED" });
    }
  }

  return result;
}

function chooseCorrectFixturesForTarget(
  targetPoints,
  settledFixtures,
  userIndex,
) {
  if (targetPoints <= 0) {
    return [];
  }

  const candidates = rotate(settledFixtures, userIndex)
    .map((fixture) => ({
      fixture,
      points: snapshotValuesForOutcome(fixture.snapshot, fixture.finalOutcome)
        .points,
    }))
    .sort((left, right) => right.points - left.points);
  const chosen = [];
  let total = 0;

  for (const candidate of candidates) {
    if (total + candidate.points > targetPoints + 3 && chosen.length > 0) {
      continue;
    }

    chosen.push(candidate.fixture);
    total += candidate.points;

    if (total >= targetPoints - 2) {
      break;
    }
  }

  return chosen;
}

function plannedSettledIncorrectCount(targetPoints, userIndex) {
  if (targetPoints >= 50) {
    return 7 + (userIndex % 4);
  }

  if (targetPoints >= 25) {
    return 5 + (userIndex % 5);
  }

  if (targetPoints >= 10) {
    return 3 + (userIndex % 4);
  }

  return 1 + (userIndex % 2);
}

function plannedTodayPendingCount(targetPoints, userIndex) {
  if (targetPoints >= 35) {
    return 1 + (userIndex % 2);
  }

  if (targetPoints >= 10) {
    return userIndex % 3 === 0 ? 1 : 0;
  }

  return userIndex % 8 === 0 ? 1 : 0;
}

async function syncDailyUsageForUser(userId, currentInstant) {
  const businessDates = await prisma.prediction.findMany({
    where: { userId },
    select: {
      slotType: true,
      fixture: { select: { kickoffAt: true } },
    },
  });
  const usageByDate = new Map();

  for (const prediction of businessDates) {
    const businessDate = getBusinessDate(prediction.fixture.kickoffAt);
    const current = usageByDate.get(businessDate) ?? {
      freeUsed: 0,
      rewardedUsed: 0,
    };

    if (prediction.slotType === "FREE") {
      current.freeUsed += 1;
    } else {
      current.rewardedUsed += 1;
    }

    usageByDate.set(businessDate, current);
  }

  const currentBusinessDate = getBusinessDate(currentInstant);

  if (!usageByDate.has(currentBusinessDate)) {
    usageByDate.set(currentBusinessDate, { freeUsed: 0, rewardedUsed: 0 });
  }

  for (const [businessDate, usage] of usageByDate.entries()) {
    await prisma.dailyPredictionUsage.upsert({
      where: {
        userId_businessDate: {
          userId,
          businessDate: businessDateToDatabaseDate(businessDate),
        },
      },
      update: usage,
      create: {
        userId,
        businessDate: businessDateToDatabaseDate(businessDate),
        ...usage,
      },
    });
  }
}

async function recalculateTournamentParticipants(tournamentId) {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    include: { user: true },
  });
  let predictionCount = 0;

  for (const participant of participants) {
    const predictions = await prisma.prediction.findMany({
      where: { tournamentId, userId: participant.userId },
      select: {
        earnedPoints: true,
        resultStatus: true,
      },
    });
    predictionCount += predictions.length;

    await prisma.tournamentParticipant.update({
      where: { id: participant.id },
      data: {
        tournamentPoints: predictions.reduce(
          (sum, prediction) => sum + prediction.earnedPoints,
          0,
        ),
        predictionsCount: predictions.length,
        correctPredictionsCount: predictions.filter(
          (prediction) => prediction.resultStatus === "CORRECT",
        ).length,
      },
    });
  }

  const top = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    include: { user: true },
    orderBy: [{ tournamentPoints: "desc" }, { id: "asc" }],
    take: 10,
  });
  const incorrectCounts = await prisma.prediction.groupBy({
    by: ["userId"],
    where: {
      tournamentId,
      resultStatus: "INCORRECT",
      userId: { in: top.map((participant) => participant.userId) },
    },
    _count: { _all: true },
  });
  const incorrectByUserId = new Map(
    incorrectCounts.map((row) => [row.userId, row._count._all]),
  );

  return {
    predictionCount,
    top10: top.map((participant, index) => ({
      rank: index + 1,
      player:
        participant.user.username ??
        participant.user.firstName ??
        participant.user.telegramUserId.toString(),
      points: participant.tournamentPoints,
      predictions: participant.predictionsCount,
      correct: participant.correctPredictionsCount,
      wrong: incorrectByUserId.get(participant.userId) ?? 0,
    })),
  };
}

function snapshotValuesForOutcome(snapshot, outcome) {
  switch (outcome) {
    case "HOME":
      return {
        probability: snapshot.homeProbability,
        points: snapshot.homePoints,
      };
    case "DRAW":
      return {
        probability: snapshot.drawProbability,
        points: snapshot.drawPoints,
      };
    case "AWAY":
      return {
        probability: snapshot.awayProbability,
        points: snapshot.awayPoints,
      };
  }
}

function firstIncorrectOutcome(finalOutcome, index) {
  return ["HOME", "DRAW", "AWAY"].filter((outcome) => outcome !== finalOutcome)[
    index % 2
  ];
}

function outcomeByIndex(index) {
  return ["HOME", "DRAW", "AWAY"][index % 3];
}

function rotate(items, offset) {
  if (items.length === 0) {
    return [];
  }

  const normalizedOffset = offset % items.length;
  return [
    ...items.slice(normalizedOffset),
    ...items.slice(0, normalizedOffset),
  ];
}

function createSeedKickoffTimes(now, range, count) {
  const minimumLeadMs = 15 * 60 * 1000;
  const latestKickoff = range.endUtc.getTime() - 5 * 60 * 1000;
  const earliestKickoff = Math.max(
    now.getTime() + minimumLeadMs,
    range.startUtc.getTime() + 12 * 60 * 60 * 1000,
  );

  if (earliestKickoff >= latestKickoff) {
    const fallbackStart = Math.max(
      now.getTime() + 60 * 1000,
      range.startUtc.getTime(),
    );
    const fallbackEnd = range.endUtc.getTime() - 1000;

    if (fallbackStart >= fallbackEnd) {
      return Array.from(
        { length: count },
        (_, index) => new Date(range.endUtc.getTime() - (count - index) * 1000),
      );
    }

    return spreadTimes(fallbackStart, fallbackEnd, count);
  }

  return spreadTimes(earliestKickoff, latestKickoff, count);
}

function createRelativeKickoff(now, dayOffset, londonHour) {
  const businessDate = getBusinessDate(
    new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000),
  );
  const [year, month, day] = businessDate.split("-").map(Number);

  return zonedLocalTimeToUtc({
    year,
    month,
    day,
    hour: londonHour,
    minute: 0,
    second: 0,
  });
}

function finalOutcomeForScore(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return "HOME";
  }

  if (homeScore < awayScore) {
    return "AWAY";
  }

  return "DRAW";
}

function spreadTimes(startMs, endMs, count) {
  if (count === 1) {
    return [new Date(startMs)];
  }

  const stepMs = Math.max(1, Math.floor((endMs - startMs) / (count - 1)));

  return Array.from(
    { length: count },
    (_, index) => new Date(startMs + stepMs * index),
  );
}

function getBusinessDate(instant) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getBusinessDayRangeUtc(businessDate) {
  const [year, month, day] = businessDate.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    startUtc: zonedLocalTimeToUtc({
      year,
      month,
      day,
      hour: 0,
      minute: 0,
      second: 0,
    }),
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

function businessDateToDatabaseDate(businessDate) {
  const [year, month, day] = businessDate.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
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
      })
        .formatToParts(instant)
        .map((part) => [part.type, part.value]),
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
