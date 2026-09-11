import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const DEFAULT_DEV_TELEGRAM_USER_ID = "900000001";
const MATCHES_REWARD_PLACEMENT = "MATCHES_EXTRA_PREDICTION";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset predictions with NODE_ENV=production.");
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const telegramUserId = parseTelegramUserId(
  getArgValue("--telegram-user-id") ??
    process.env.DEV_RESET_TELEGRAM_USER_ID ??
    process.env.DEV_TELEGRAM_USER_ID ??
    DEFAULT_DEV_TELEGRAM_USER_ID,
);
const now = new Date();
const businessDate = getBusinessDate(now);
const businessDateForDatabase = businessDateToDatabaseDate(businessDate);
const { startUtc, endUtc } = getBusinessDayRangeUtc(businessDate);

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

try {
  const result = dryRun
    ? await inspectReset()
    : await prisma.$transaction((tx) => resetTodayPredictions(tx));

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "reset",
        telegramUserId: telegramUserId.toString(),
        businessDate,
        businessDayRangeUtc: {
          startUtc: startUtc.toISOString(),
          endUtc: endUtc.toISOString(),
        },
        ...result,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}

function getArgValue(name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);

  if (index >= 0) {
    return args[index + 1] ?? null;
  }

  return null;
}

function parseTelegramUserId(value) {
  try {
    return BigInt(value);
  } catch {
    console.error(`Invalid telegram user id: ${value}`);
    process.exit(1);
  }
}

async function inspectReset() {
  const user = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true },
  });

  if (!user) {
    return {
      userFound: false,
      predictionsToDelete: 0,
      consumedAdRewardsToDelete: 0,
      unconsumedTodayAdRewardsToDelete: 0,
      dailyPredictionUsageRowsToDelete: 0,
      affectedTournamentParticipants: 0,
    };
  }

  const predictions = await findTodayPredictions(prisma, user.id);
  const predictionIds = predictions.map((prediction) => prediction.id);
  const [
    consumedAdRewardsToDelete,
    unconsumedTodayAdRewardsToDelete,
    dailyPredictionUsageRowsToDelete,
  ] = await Promise.all([
    prisma.adReward.count({
      where: { consumedByPredictionId: { in: predictionIds } },
    }),
    prisma.adReward.count({
      where: {
        userId: user.id,
        placement: MATCHES_REWARD_PLACEMENT,
        consumedByPredictionId: null,
        createdAt: { gte: startUtc, lt: endUtc },
      },
    }),
    prisma.dailyPredictionUsage.count({
      where: {
        userId: user.id,
        businessDate: businessDateForDatabase,
      },
    }),
  ]);

  return {
    userFound: true,
    predictionsToDelete: predictions.length,
    consumedAdRewardsToDelete,
    unconsumedTodayAdRewardsToDelete,
    dailyPredictionUsageRowsToDelete,
    affectedTournamentParticipants: new Set(
      predictions.map((prediction) => prediction.tournamentId),
    ).size,
  };
}

async function resetTodayPredictions(tx) {
  const user = await tx.user.findUnique({
    where: { telegramUserId },
    select: { id: true },
  });

  if (!user) {
    return {
      userFound: false,
      deletedPredictions: 0,
      deletedConsumedAdRewards: 0,
      deletedUnconsumedTodayAdRewards: 0,
      deletedDailyPredictionUsageRows: 0,
      updatedTournamentParticipants: 0,
    };
  }

  const predictions = await findTodayPredictions(tx, user.id);
  const predictionIds = predictions.map((prediction) => prediction.id);
  const tournamentIds = [
    ...new Set(predictions.map((prediction) => prediction.tournamentId)),
  ];

  const deletedConsumedAdRewards =
    predictionIds.length > 0
      ? await tx.adReward.deleteMany({
          where: { consumedByPredictionId: { in: predictionIds } },
        })
      : { count: 0 };
  const deletedPredictions =
    predictionIds.length > 0
      ? await tx.prediction.deleteMany({
          where: { id: { in: predictionIds } },
        })
      : { count: 0 };
  const deletedUnconsumedTodayAdRewards = await tx.adReward.deleteMany({
    where: {
      userId: user.id,
      placement: MATCHES_REWARD_PLACEMENT,
      consumedByPredictionId: null,
      createdAt: { gte: startUtc, lt: endUtc },
    },
  });
  const deletedDailyPredictionUsageRows =
    await tx.dailyPredictionUsage.deleteMany({
      where: {
        userId: user.id,
        businessDate: businessDateForDatabase,
      },
    });

  await refreshTournamentParticipants(tx, user.id, tournamentIds);

  return {
    userFound: true,
    deletedPredictions: deletedPredictions.count,
    deletedConsumedAdRewards: deletedConsumedAdRewards.count,
    deletedUnconsumedTodayAdRewards: deletedUnconsumedTodayAdRewards.count,
    deletedDailyPredictionUsageRows: deletedDailyPredictionUsageRows.count,
    updatedTournamentParticipants: tournamentIds.length,
  };
}

async function findTodayPredictions(client, userId) {
  return client.prediction.findMany({
    where: {
      userId,
      fixture: {
        kickoffAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
    },
    select: {
      id: true,
      tournamentId: true,
    },
  });
}

async function refreshTournamentParticipants(tx, userId, tournamentIds) {
  if (tournamentIds.length === 0) {
    return;
  }

  const predictionCounts = await tx.prediction.groupBy({
    by: ["tournamentId"],
    where: {
      userId,
      tournamentId: { in: tournamentIds },
    },
    _count: { id: true },
    _sum: { earnedPoints: true },
  });
  const correctCounts = await tx.prediction.groupBy({
    by: ["tournamentId"],
    where: {
      userId,
      tournamentId: { in: tournamentIds },
      resultStatus: "CORRECT",
    },
    _count: { id: true },
  });
  const countsByTournamentId = new Map(
    predictionCounts.map((count) => [count.tournamentId, count]),
  );
  const correctCountsByTournamentId = new Map(
    correctCounts.map((count) => [count.tournamentId, count._count.id]),
  );

  for (const tournamentId of tournamentIds) {
    const count = countsByTournamentId.get(tournamentId);

    await tx.tournamentParticipant.updateMany({
      where: {
        tournamentId,
        userId,
      },
      data: {
        predictionsCount: count?._count.id ?? 0,
        correctPredictionsCount:
          correctCountsByTournamentId.get(tournamentId) ?? 0,
        tournamentPoints: count?._sum.earnedPoints ?? 0,
      },
    });
  }
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

function getBusinessDayRangeUtc(businessDateValue) {
  const [year, month, day] = businessDateValue.split("-").map(Number);
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

function businessDateToDatabaseDate(businessDateValue) {
  const [year, month, day] = businessDateValue.split("-").map(Number);

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

function getTimeZoneOffsetMilliseconds(instant) {
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

  const asUtcTimestamp = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtcTimestamp - instant.getTime();
}
