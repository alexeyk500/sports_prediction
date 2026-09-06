import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getBusinessDate, getBusinessDayRangeUtc, businessDateToDatabaseDate } from "@/lib/time/business-time";
import { GET as getBootstrap } from "@/app/api/bootstrap/route";
import { GET as getTodayFixtures } from "@/app/api/fixtures/today/route";
import { POST as postPrediction } from "@/app/api/predictions/route";
import { GET as getTodayPredictions } from "@/app/api/predictions/today/route";
import { PATCH as patchPrediction } from "@/app/api/predictions/[predictionId]/route";
import { GET as getSettings, PATCH as patchSettings } from "@/app/api/settings/route";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import {
  attachTestScoringSnapshot,
  createSupportedTestCompetition,
  createTestAdReward,
  createTestCompetition,
  createTestFixture,
  createTestUser,
  uniqueTestKey,
  uniqueTournamentNumber,
} from "../helpers/factories";
import {
  createApiRequest,
  responseJson,
  signTelegramInitData,
  testTelegramBotToken,
} from "./http-test-helpers";

process.env.TELEGRAM_BOT_TOKEN = testTelegramBotToken;
process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = "86400";

const prisma = createTestPrismaClient();

describe("Telegram auth HTTP vertical slice", () => {
  beforeAll(async () => {
    const now = new Date();

    await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "ACTIVE",
        startsAt: new Date(now.getTime() - 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        prizePoolNanoTon: 123000000000n,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates User from valid Telegram initData and updates profile without duplicate User", async () => {
    const telegramUserId = "777000111222";
    const firstInitData = signedInitData({
      id: telegramUserId,
      username: "alice",
      first_name: "Alice",
      last_name: "Initial",
      language_code: "en",
    });
    const firstResponse = await getBootstrap(createApiRequest("/api/bootstrap", firstInitData));

    expect(firstResponse.status).toBe(200);

    const secondInitData = signedInitData({
      id: telegramUserId,
      username: "alice_new",
      first_name: "Alice",
      last_name: "Updated",
      language_code: "fr",
    });
    const secondResponse = await getBootstrap(createApiRequest("/api/bootstrap", secondInitData));
    const body = await responseJson(secondResponse) as {
      user: {
        username: string;
        lastName: string;
        languageCode: string;
      };
    };

    expect(secondResponse.status).toBe(200);
    expect(body.user).toMatchObject({
      username: "alice_new",
      lastName: "Updated",
      languageCode: "fr",
    });
    expect(await prisma.user.count({ where: { telegramUserId: BigInt(telegramUserId) } })).toBe(1);
  });

  it("initializes locale from supported Telegram language and falls back for unsupported language", async () => {
    const ruResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", signedInitData({ id: "777000111230", language_code: "ru-RU" })),
    );
    const ruBody = await responseJson(ruResponse) as { settings: { locale: string; appearance: string } };
    const fallbackResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", signedInitData({ id: "777000111231", language_code: "fr" })),
    );
    const fallbackBody = await responseJson(fallbackResponse) as { settings: { locale: string; appearance: string } };

    expect(ruResponse.status).toBe(200);
    expect(ruBody.settings).toMatchObject({ locale: "ru", appearance: "system" });
    expect(fallbackResponse.status).toBe(200);
    expect(fallbackBody.settings).toMatchObject({ locale: "en", appearance: "system" });
  });

  it("does not overwrite manual locale during later Telegram profile sync", async () => {
    const telegramUserId = "777000111232";
    const firstInitData = signedInitData({ id: telegramUserId, language_code: "ru" });
    const firstResponse = await getBootstrap(createApiRequest("/api/bootstrap", firstInitData));

    expect(firstResponse.status).toBe(200);

    const updatedSettingsResponse = await patchSettings(
      createApiRequest("/api/settings", firstInitData, {
        method: "PATCH",
        body: { locale: "de" },
      }),
    );

    expect(updatedSettingsResponse.status).toBe(200);

    const secondInitData = signedInitData({ id: telegramUserId, language_code: "es" });
    const secondResponse = await getBootstrap(createApiRequest("/api/bootstrap", secondInitData));
    const secondBody = await responseJson(secondResponse) as {
      user: { languageCode: string };
      settings: { locale: string };
    };

    expect(secondResponse.status).toBe(200);
    expect(secondBody.user.languageCode).toBe("es");
    expect(secondBody.settings.locale).toBe("de");
  });

  it("rejects invalid Telegram auth", async () => {
    const response = await getBootstrap(createApiRequest("/api/bootstrap", "auth_date=1&hash=bad"));
    const body = await responseJson(response) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("INVALID_TELEGRAM_INIT_DATA");
  });

  it("returns bootstrap state with zero and existing daily usage, current tournament, and rating", async () => {
    const initData = signedInitData({ id: "777000111223", username: "bootstrap_user" });
    const zeroResponse = await getBootstrap(createApiRequest("/api/bootstrap", initData));
    const zeroBody = await responseJson(zeroResponse) as {
      user: { id: string; telegramUserId: string };
      currentTournament: { prizePoolNanoTon: string } | null;
      dailyPredictionUsage: { freeUsed: number; rewardedUsed: number; totalUsed: number };
      rating: null | { rating: number };
      settings: { locale: string; appearance: string };
    };

    expect(zeroResponse.status).toBe(200);
    expect(zeroBody.currentTournament).toMatchObject({ prizePoolNanoTon: "123000000000" });
    expect(zeroBody.dailyPredictionUsage).toMatchObject({ freeUsed: 0, rewardedUsed: 0, totalUsed: 0 });
    expect(zeroBody.rating).toBeNull();
    expect(zeroBody.settings).toMatchObject({ locale: "en", appearance: "system" });

    await prisma.dailyPredictionUsage.create({
      data: {
        userId: zeroBody.user.id,
        businessDate: businessDateToDatabaseDate(getBusinessDate(new Date())),
        freeUsed: 2,
        rewardedUsed: 1,
      },
    });
    await prisma.ratingProfile.create({
      data: {
        userId: zeroBody.user.id,
        rating: 1512,
        league: "BRONZE_III",
        qualifiedCupsCount: 1,
      },
    });

    const existingResponse = await getBootstrap(createApiRequest("/api/bootstrap", initData));
    const existingBody = await responseJson(existingResponse) as {
      dailyPredictionUsage: { freeUsed: number; rewardedUsed: number; totalUsed: number };
      rating: { rating: number; league: string; qualifiedCupsCount: number };
    };

    expect(existingBody.dailyPredictionUsage).toMatchObject({ freeUsed: 2, rewardedUsed: 1, totalUsed: 3 });
    expect(existingBody.rating).toMatchObject({ rating: 1512, league: "BRONZE_III", qualifiedCupsCount: 1 });
  });

  it("reads and updates settings for the authenticated user", async () => {
    const initData = signedInitData({ id: "777000111233" });
    const initialResponse = await getSettings(createApiRequest("/api/settings", initData));
    const initialBody = await responseJson(initialResponse) as { locale: string; appearance: string };

    expect(initialResponse.status).toBe(200);
    expect(initialBody).toMatchObject({ locale: "en", appearance: "system" });

    const localeResponse = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { locale: "ar" },
      }),
    );
    const localeBody = await responseJson(localeResponse) as { locale: string; appearance: string };

    expect(localeResponse.status).toBe(200);
    expect(localeBody).toMatchObject({ locale: "ar", appearance: "system" });

    const appearanceResponse = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { appearance: "dark" },
      }),
    );
    const appearanceBody = await responseJson(appearanceResponse) as { locale: string; appearance: string };

    expect(appearanceResponse.status).toBe(200);
    expect(appearanceBody).toMatchObject({ locale: "ar", appearance: "dark" });
  });

  it("rejects unsupported settings values", async () => {
    const initData = signedInitData({ id: "777000111234" });
    const invalidLocale = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { locale: "fr" },
      }),
    );
    const invalidAppearance = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { appearance: "sepia" },
      }),
    );
    const invalidLocaleBody = await responseJson(invalidLocale) as { error: { code: string } };
    const invalidAppearanceBody = await responseJson(invalidAppearance) as { error: { code: string } };

    expect(invalidLocale.status).toBe(400);
    expect(invalidLocaleBody.error.code).toBe("VALIDATION_ERROR");
    expect(invalidAppearance.status).toBe(400);
    expect(invalidAppearanceBody.error.code).toBe("VALIDATION_ERROR");
  });

  it("enforces canonical slug uniqueness for teams and competitions", async () => {
    const competitionSlug = uniqueTestKey("shared-competition-slug").replace(/_/g, "-");
    const teamSlug = uniqueTestKey("shared-team-slug").replace(/_/g, "-");

    await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("competition_provider"),
        code: uniqueTestKey("COMPETITION_CODE"),
        name: "Competition A",
        slug: competitionSlug,
      },
    });
    await prisma.team.create({
      data: {
        providerTeamId: uniqueTestKey("team_provider"),
        name: "Team A",
        slug: teamSlug,
      },
    });

    await expect(
      prisma.competition.create({
        data: {
          providerCompetitionId: uniqueTestKey("competition_provider"),
          code: uniqueTestKey("COMPETITION_CODE"),
          name: "Competition B",
          slug: competitionSlug,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      prisma.team.create({
        data: {
          providerTeamId: uniqueTestKey("team_provider"),
          name: "Team B",
          slug: teamSlug,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("returns today's displayable fixtures and excludes tomorrow, inactive, and unsupported competitions", async () => {
    const initData = signedInitData({ id: "777000111224" });
    const todayRange = getBusinessDayRangeUtc(getBusinessDate(new Date()));
    const activeCompetition = await createSupportedTestCompetition(prisma, "LALIGA");
    const inactiveCompetition = await createTestCompetition(prisma, { code: "SERIE_A", isActive: false });
    const unsupportedCompetition = await createTestCompetition(prisma, { code: uniqueTestKey("UNSUPPORTED") });
    const includedFixture = await createTestFixture(prisma, {
      competitionId: activeCompetition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 12 * 60 * 60 * 1000),
    });
    await Promise.all([
      prisma.competition.update({
        where: { id: activeCompetition.id },
        data: { slug: "la-liga" },
      }),
      prisma.team.update({
        where: { id: includedFixture.homeTeamId },
        data: { slug: "home-test" },
      }),
      prisma.team.update({
        where: { id: includedFixture.awayTeamId },
        data: { slug: "away-test" },
      }),
    ]);
    const tomorrowFixture = await createTestFixture(prisma, {
      competitionId: activeCompetition.id,
      kickoffAt: new Date(todayRange.endUtc.getTime() + 60 * 60 * 1000),
    });
    const inactiveFixture = await createTestFixture(prisma, {
      competitionId: inactiveCompetition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 13 * 60 * 60 * 1000),
    });
    const unsupportedFixture = await createTestFixture(prisma, {
      competitionId: unsupportedCompetition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 14 * 60 * 60 * 1000),
    });

    await Promise.all([
      attachTestScoringSnapshot(prisma, includedFixture.id),
      attachTestScoringSnapshot(prisma, tomorrowFixture.id),
      attachTestScoringSnapshot(prisma, inactiveFixture.id),
      attachTestScoringSnapshot(prisma, unsupportedFixture.id),
    ]);

    const response = await getTodayFixtures(createApiRequest("/api/fixtures/today", initData));
    const body = await responseJson(response) as {
      fixtures: Array<{
        id: string;
        competition: { slug: string };
        homeTeam: { slug: string };
        awayTeam: { slug: string };
        outcomes: { home: { points: number }; draw: { points: number }; away: { points: number } };
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.fixtures.map((fixture) => fixture.id)).toContain(includedFixture.id);
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(tomorrowFixture.id);
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(inactiveFixture.id);
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(unsupportedFixture.id);
    expect(body.fixtures.find((fixture) => fixture.id === includedFixture.id)?.outcomes).toMatchObject({
      home: { points: 13 },
      draw: { points: 24 },
      away: { points: 27 },
    });
    expect(body.fixtures.find((fixture) => fixture.id === includedFixture.id)).toMatchObject({
      competition: { slug: "la-liga" },
      homeTeam: { slug: "home-test" },
      awayTeam: { slug: "away-test" },
    });
    const includedDto = body.fixtures.find((fixture) => fixture.id === includedFixture.id);
    expect(includedDto?.competition).not.toHaveProperty("logoUrl");
    expect(includedDto?.homeTeam).not.toHaveProperty("logoUrl");
    expect(includedDto?.awayTeam).not.toHaveProperty("logoUrl");
  });

  it("creates and updates Prediction through HTTP without trusting client user identity", async () => {
    const userInitData = signedInitData({ id: "777000111225" });
    const otherUser = await createTestUser(prisma);
    const fixture = await createHttpEligibleFixture();
    const rejectedImpersonation = await postPrediction(
      createApiRequest("/api/predictions", userInitData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          userId: otherUser.id,
          fixtureId: fixture.id,
          selectedOutcome: "HOME",
        },
      }),
    );
    const createdResponse = await postPrediction(
      createApiRequest("/api/predictions", userInitData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          fixtureId: fixture.id,
          selectedOutcome: "HOME",
        },
      }),
    );
    const createdBody = await responseJson(createdResponse) as { predictionId: string; userId: string };

    expect(rejectedImpersonation.status).toBe(400);
    expect(createdResponse.status).toBe(201);
    expect(createdBody.userId).not.toBe(otherUser.id);

    const updatedResponse = await patchPrediction(
      createApiRequest(`/api/predictions/${createdBody.predictionId}`, userInitData, {
        method: "PATCH",
        body: { selectedOutcome: "DRAW" },
      }),
      { params: Promise.resolve({ predictionId: createdBody.predictionId }) },
    );
    const todayPredictionsResponse = await getTodayPredictions(
      createApiRequest("/api/predictions/today", userInitData),
    );
    const todayPredictionsBody = await responseJson(todayPredictionsResponse) as {
      predictions: Array<{ id: string; selectedOutcome: string; editable: boolean }>;
    };

    expect(updatedResponse.status).toBe(200);
    expect(todayPredictionsBody.predictions).toContainEqual(
      expect.objectContaining({ id: createdBody.predictionId, selectedOutcome: "DRAW", editable: true }),
    );
  });

  it("returns domain errors for fourth prediction without reward and locked update", async () => {
    const initData = signedInitData({ id: "777000111226" });

    for (let index = 0; index < 3; index += 1) {
      const fixture = await createHttpEligibleFixture();
      const response = await postPrediction(
        createApiRequest("/api/predictions", initData, {
          method: "POST",
          idempotencyKey: uniqueTestKey("idem"),
          body: { fixtureId: fixture.id, selectedOutcome: "HOME" },
        }),
      );

      expect(response.status).toBe(201);
    }

    const fourthFixture = await createHttpEligibleFixture();
    const rejectedFourth = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: { fixtureId: fourthFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const rejectedFourthBody = await responseJson(rejectedFourth) as { error: { code: string } };

    expect(rejectedFourth.status).toBe(429);
    expect(rejectedFourthBody.error.code).toBe("REWARDED_AD_REQUIRED");

    const reward = await createTestAdReward(
      prisma,
      (await prisma.user.findUniqueOrThrow({ where: { telegramUserId: 777000111226n } })).id,
      { expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    );
    const rewardedFixture = await createHttpEligibleFixture();
    const created = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: { fixtureId: rewardedFixture.id, selectedOutcome: "HOME", adRewardId: reward.id },
      }),
    );
    const createdBody = await responseJson(created) as { predictionId: string };

    await prisma.fixture.update({
      where: { id: rewardedFixture.id },
      data: { kickoffAt: new Date(Date.now() - 1000) },
    });

    const locked = await patchPrediction(
      createApiRequest(`/api/predictions/${createdBody.predictionId}`, initData, {
        method: "PATCH",
        body: { selectedOutcome: "AWAY" },
      }),
      { params: Promise.resolve({ predictionId: createdBody.predictionId }) },
    );
    const lockedBody = await responseJson(locked) as { error: { code: string } };

    expect(locked.status).toBe(423);
    expect(lockedBody.error.code).toBe("PREDICTION_LOCKED");
  });
});

function signedInitData(user: {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}): string {
  return signTelegramInitData({
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: uniqueTestKey("query"),
    user: JSON.stringify(user),
  });
}

async function createHttpEligibleFixture() {
  const todayRange = getBusinessDayRangeUtc(getBusinessDate(new Date()));
  const competition = await createSupportedTestCompetition(prisma, "EPL");
  const fixture = await createTestFixture(prisma, {
    competitionId: competition.id,
    kickoffAt: new Date(Math.max(Date.now() + 60 * 60 * 1000, todayRange.startUtc.getTime() + 12 * 60 * 60 * 1000)),
  });

  await attachTestScoringSnapshot(prisma, fixture.id);

  return fixture;
}
