import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getBusinessDate,
  getBusinessDayRangeUtc,
  businessDateToDatabaseDate,
} from "@/lib/time/business-time";
import { GET as getBootstrap } from "@/app/api/bootstrap/route";
import { GET as getMonetagSession } from "@/app/api/ad-rewards/monetag/sessions/[adRewardId]/route";
import { POST as confirmMonetagSession } from "@/app/api/ad-rewards/monetag/sessions/[adRewardId]/confirm/route";
import { POST as createMonetagSession } from "@/app/api/ad-rewards/monetag/sessions/route";
import { GET as getTodayFixtures } from "@/app/api/fixtures/today/route";
import { POST as postPrediction } from "@/app/api/predictions/route";
import { GET as getTodayPredictions } from "@/app/api/predictions/today/route";
import { PATCH as patchPrediction } from "@/app/api/predictions/[predictionId]/route";
import {
  GET as getSettings,
  PATCH as patchSettings,
} from "@/app/api/settings/route";
import { GET as getPrizePayouts } from "@/app/api/prizes-payouts/route";
import { POST as postPrizeClaim } from "@/app/api/prizes-payouts/[entitlementId]/claim/route";
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
process.env.MONETAG_REWARDED_INTERSTITIAL_ZONE_ID = "1234567";

const prisma = createTestPrismaClient();

describe("Telegram auth HTTP vertical slice", () => {
  beforeAll(async () => {
    const now = new Date();

    const tournament = await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "ACTIVE",
        startsAt: new Date(now.getTime() - 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        prizePoolNanoTon: 123000000000n,
      },
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
          toRank: 10,
          amount: "0.5",
        },
      ],
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
    const firstResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", firstInitData),
    );

    expect(firstResponse.status).toBe(200);

    const secondInitData = signedInitData({
      id: telegramUserId,
      username: "alice_new",
      first_name: "Alice",
      last_name: "Updated",
      language_code: "fr",
    });
    const secondResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", secondInitData),
    );
    const body = (await responseJson(secondResponse)) as {
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
    expect(
      await prisma.user.count({
        where: { telegramUserId: BigInt(telegramUserId) },
      }),
    ).toBe(1);
  });

  it("initializes locale from supported Telegram language and falls back for unsupported language", async () => {
    const ruResponse = await getBootstrap(
      createApiRequest(
        "/api/bootstrap",
        signedInitData({ id: "777000111230", language_code: "ru-RU" }),
      ),
    );
    const ruBody = (await responseJson(ruResponse)) as {
      settings: { locale: string; appearance: string };
    };
    const fallbackResponse = await getBootstrap(
      createApiRequest(
        "/api/bootstrap",
        signedInitData({ id: "777000111231", language_code: "fr" }),
      ),
    );
    const fallbackBody = (await responseJson(fallbackResponse)) as {
      settings: { locale: string; appearance: string };
    };

    expect(ruResponse.status).toBe(200);
    expect(ruBody.settings).toMatchObject({
      locale: "ru",
      appearance: "system",
    });
    expect(fallbackResponse.status).toBe(200);
    expect(fallbackBody.settings).toMatchObject({
      locale: "en",
      appearance: "system",
    });
  });

  it("does not overwrite manual locale during later Telegram profile sync", async () => {
    const telegramUserId = "777000111232";
    const firstInitData = signedInitData({
      id: telegramUserId,
      language_code: "ru",
    });
    const firstResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", firstInitData),
    );

    expect(firstResponse.status).toBe(200);

    const updatedSettingsResponse = await patchSettings(
      createApiRequest("/api/settings", firstInitData, {
        method: "PATCH",
        body: { locale: "de" },
      }),
    );

    expect(updatedSettingsResponse.status).toBe(200);

    const secondInitData = signedInitData({
      id: telegramUserId,
      language_code: "es",
    });
    const secondResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", secondInitData),
    );
    const secondBody = (await responseJson(secondResponse)) as {
      user: { languageCode: string };
      settings: { locale: string };
    };

    expect(secondResponse.status).toBe(200);
    expect(secondBody.user.languageCode).toBe("es");
    expect(secondBody.settings.locale).toBe("de");
  });

  it("rejects invalid Telegram auth", async () => {
    const response = await getBootstrap(
      createApiRequest("/api/bootstrap", "auth_date=1&hash=bad"),
    );
    const body = (await responseJson(response)) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("INVALID_TELEGRAM_INIT_DATA");
  });

  it("returns bootstrap state with zero and existing daily usage, current tournament, and rating", async () => {
    const initData = signedInitData({
      id: "777000111223",
      username: "bootstrap_user",
    });
    const zeroResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", initData),
    );
    const zeroBody = (await responseJson(zeroResponse)) as {
      user: { id: string; telegramUserId: string };
      currentTournament: {
        id: string;
        prizeCurrency: string;
        prizeDistribution: Array<{
          fromRank: number;
          toRank: number;
          amount: string;
        }>;
      } | null;
      cup: {
        participantCount: number;
        currentUserRow: unknown;
        leaderboard?: unknown;
      } | null;
      dailyPredictionUsage: {
        freeUsed: number;
        rewardedUsed: number;
        totalUsed: number;
      };
      rating: null | { rating: number };
      settings: { locale: string; appearance: string };
    };

    expect(zeroResponse.status).toBe(200);
    expect(zeroBody.currentTournament).toMatchObject({
      prizeCurrency: "USDT",
      prizeDistribution: [
        { fromRank: 1, toRank: 1, amount: "3" },
        { fromRank: 2, toRank: 10, amount: "0.5" },
      ],
    });
    expect(zeroBody.cup).toMatchObject({
      participantCount: 0,
      currentUserRow: null,
    });
    expect(zeroBody.cup && "leaderboard" in zeroBody.cup).toBe(false);
    expect(zeroBody.dailyPredictionUsage).toMatchObject({
      freeUsed: 0,
      rewardedUsed: 0,
      totalUsed: 0,
    });
    expect(zeroBody.rating).toBeNull();
    expect(zeroBody.settings).toMatchObject({
      locale: "en",
      appearance: "system",
    });

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

    const existingResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", initData),
    );
    const existingBody = (await responseJson(existingResponse)) as {
      dailyPredictionUsage: {
        freeUsed: number;
        rewardedUsed: number;
        totalUsed: number;
      };
      rating: { rating: number; league: string; qualifiedCupsCount: number };
    };

    expect(existingBody.dailyPredictionUsage).toMatchObject({
      freeUsed: 2,
      rewardedUsed: 1,
      totalUsed: 3,
    });
    expect(existingBody.rating).toMatchObject({
      rating: 1512,
      league: "BRONZE_III",
      qualifiedCupsCount: 1,
    });
  });

  it("reads and updates settings for the authenticated user", async () => {
    const initData = signedInitData({ id: "777000111233" });
    const initialResponse = await getSettings(
      createApiRequest("/api/settings", initData),
    );
    const initialBody = (await responseJson(initialResponse)) as {
      locale: string;
      appearance: string;
    };

    expect(initialResponse.status).toBe(200);
    expect(initialBody).toMatchObject({ locale: "en", appearance: "system" });

    const localeResponse = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { locale: "ar" },
      }),
    );
    const localeBody = (await responseJson(localeResponse)) as {
      locale: string;
      appearance: string;
    };

    expect(localeResponse.status).toBe(200);
    expect(localeBody).toMatchObject({ locale: "ar", appearance: "system" });

    const appearanceResponse = await patchSettings(
      createApiRequest("/api/settings", initData, {
        method: "PATCH",
        body: { appearance: "dark" },
      }),
    );
    const appearanceBody = (await responseJson(appearanceResponse)) as {
      locale: string;
      appearance: string;
    };

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
    const invalidLocaleBody = (await responseJson(invalidLocale)) as {
      error: { code: string };
    };
    const invalidAppearanceBody = (await responseJson(invalidAppearance)) as {
      error: { code: string };
    };

    expect(invalidLocale.status).toBe(400);
    expect(invalidLocaleBody.error.code).toBe("VALIDATION_ERROR");
    expect(invalidAppearance.status).toBe(400);
    expect(invalidAppearanceBody.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns authenticated prize payouts and claims only owned entitlements", async () => {
    const initData = signedInitData({ id: "777000111235" });
    const bootstrapResponse = await getBootstrap(
      createApiRequest("/api/bootstrap", initData),
    );
    const bootstrapBody = (await responseJson(bootstrapResponse)) as {
      user: { id: string };
    };
    const tournament = await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "FINISHED",
        startsAt: new Date("2026-08-01T00:00:00.000Z"),
        endsAt: new Date("2026-08-08T00:00:00.000Z"),
        prizePoolNanoTon: 0n,
        prizeCurrency: "USDT",
      },
    });
    const entitlement = await prisma.prizeEntitlement.create({
      data: {
        tournamentId: tournament.id,
        userId: bootstrapBody.user.id,
        finalPlacement: 1,
        amount: "12.5",
        asset: "USDT",
        network: "TRC20",
        settledAt: new Date("2026-09-10T10:00:00.000Z"),
      },
    });
    const listResponse = await getPrizePayouts(
      createApiRequest("/api/prizes-payouts", initData),
    );
    const listBody = (await responseJson(listResponse)) as {
      summary: { totalWon: string; pending: string; paid: string };
      items: Array<{ entitlementId: string; status: string }>;
    };

    expect(listResponse.status).toBe(200);
    expect(listBody.summary).toMatchObject({
      totalWon: "12.5",
      pending: "12.5",
      paid: "0",
    });
    expect(listBody.items).toHaveLength(1);
    expect(listBody.items[0]).toMatchObject({
      entitlementId: entitlement.id,
      status: "READY_TO_CLAIM",
    });

    const claimResponse = await postPrizeClaim(
      createApiRequest(
        `/api/prizes-payouts/${entitlement.id}/claim`,
        initData,
        {
          method: "POST",
          body: { walletAddress: `T${"C".repeat(33)}` },
        },
      ),
      { params: Promise.resolve({ entitlementId: entitlement.id }) },
    );
    const claimBody = (await responseJson(claimResponse)) as {
      status: string;
      walletAddress: string;
    };

    expect(claimResponse.status).toBe(201);
    expect(claimBody).toMatchObject({
      status: "UNDER_REVIEW",
      walletAddress: `T${"C".repeat(33)}`,
    });
  });

  it("enforces canonical slug uniqueness for teams and competitions", async () => {
    const competitionSlug = uniqueTestKey("shared-competition-slug").replace(
      /_/g,
      "-",
    );
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
    const activeCompetition = await createSupportedTestCompetition(
      prisma,
      "LALIGA",
    );
    const inactiveCompetition = await createTestCompetition(prisma, {
      code: "SERIE_A",
      isActive: false,
    });
    const unsupportedCompetition = await createTestCompetition(prisma, {
      code: uniqueTestKey("UNSUPPORTED"),
    });
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

    const response = await getTodayFixtures(
      createApiRequest("/api/fixtures/today", initData),
    );
    const body = (await responseJson(response)) as {
      fixtures: Array<{
        id: string;
        competition: { slug: string };
        homeTeam: { slug: string };
        awayTeam: { slug: string };
        outcomes: {
          home: { points: number };
          draw: { points: number };
          away: { points: number };
        };
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.fixtures.map((fixture) => fixture.id)).toContain(
      includedFixture.id,
    );
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(
      tomorrowFixture.id,
    );
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(
      inactiveFixture.id,
    );
    expect(body.fixtures.map((fixture) => fixture.id)).not.toContain(
      unsupportedFixture.id,
    );
    expect(
      body.fixtures.find((fixture) => fixture.id === includedFixture.id)
        ?.outcomes,
    ).toMatchObject({
      home: { points: 13 },
      draw: { points: 24 },
      away: { points: 27 },
    });
    expect(
      body.fixtures.find((fixture) => fixture.id === includedFixture.id),
    ).toMatchObject({
      competition: { slug: "la-liga" },
      homeTeam: { slug: "home-test" },
      awayTeam: { slug: "away-test" },
    });
    const includedDto = body.fixtures.find(
      (fixture) => fixture.id === includedFixture.id,
    );
    expect(includedDto?.competition).not.toHaveProperty("logoUrl");
    expect(includedDto?.homeTeam).not.toHaveProperty("logoUrl");
    expect(includedDto?.awayTeam).not.toHaveProperty("logoUrl");
  });

  it("derives winningOutcome from settled fixture final outcome only", async () => {
    const initData = signedInitData({ id: "777000111228" });
    const todayRange = getBusinessDayRangeUtc(getBusinessDate(new Date()));
    const competition = await createSupportedTestCompetition(prisma, "EPL");
    const homeFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 12 * 60 * 60 * 1000),
    });
    const drawFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 13 * 60 * 60 * 1000),
    });
    const awayFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 14 * 60 * 60 * 1000),
    });
    const liveFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(todayRange.startUtc.getTime() + 15 * 60 * 60 * 1000),
    });

    await Promise.all([
      attachTestScoringSnapshot(prisma, homeFixture.id),
      attachTestScoringSnapshot(prisma, drawFixture.id),
      attachTestScoringSnapshot(prisma, awayFixture.id),
      attachTestScoringSnapshot(prisma, liveFixture.id),
    ]);
    await Promise.all([
      prisma.fixture.update({
        where: { id: homeFixture.id },
        data: { status: "SETTLED", finalOutcome: "HOME" },
      }),
      prisma.fixture.update({
        where: { id: drawFixture.id },
        data: { status: "SETTLED", finalOutcome: "DRAW" },
      }),
      prisma.fixture.update({
        where: { id: awayFixture.id },
        data: { status: "SETTLED", finalOutcome: "AWAY" },
      }),
      prisma.fixture.update({
        where: { id: liveFixture.id },
        data: { status: "LIVE", finalOutcome: "HOME" },
      }),
    ]);

    const response = await getTodayFixtures(
      createApiRequest("/api/fixtures/today", initData),
    );
    const body = (await responseJson(response)) as {
      fixtures: Array<{ id: string; winningOutcome: string | null }>;
    };

    expect(response.status).toBe(200);
    expect(body.fixtures).toContainEqual(
      expect.objectContaining({ id: homeFixture.id, winningOutcome: "HOME" }),
    );
    expect(body.fixtures).toContainEqual(
      expect.objectContaining({ id: drawFixture.id, winningOutcome: "DRAW" }),
    );
    expect(body.fixtures).toContainEqual(
      expect.objectContaining({ id: awayFixture.id, winningOutcome: "AWAY" }),
    );
    expect(body.fixtures).toContainEqual(
      expect.objectContaining({ id: liveFixture.id, winningOutcome: null }),
    );
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
    const createdBody = (await responseJson(createdResponse)) as {
      predictionId: string;
      userId: string;
    };

    expect(rejectedImpersonation.status).toBe(400);
    expect(createdResponse.status).toBe(201);
    expect(createdBody.userId).not.toBe(otherUser.id);

    const updatedResponse = await patchPrediction(
      createApiRequest(
        `/api/predictions/${createdBody.predictionId}`,
        userInitData,
        {
          method: "PATCH",
          body: { selectedOutcome: "DRAW" },
        },
      ),
      { params: Promise.resolve({ predictionId: createdBody.predictionId }) },
    );
    const todayPredictionsResponse = await getTodayPredictions(
      createApiRequest("/api/predictions/today", userInitData),
    );
    const todayPredictionsBody = (await responseJson(
      todayPredictionsResponse,
    )) as {
      predictions: Array<{
        id: string;
        selectedOutcome: string;
        editable: boolean;
      }>;
    };

    expect(updatedResponse.status).toBe(200);
    expect(todayPredictionsBody.predictions).toContainEqual(
      expect.objectContaining({
        id: createdBody.predictionId,
        selectedOutcome: "DRAW",
        editable: true,
      }),
    );
  });

  it("returns My Picks fixture and result context without relying on available fixtures", async () => {
    const initData = signedInitData({ id: "777000111229" });
    const fixture = await createHttpEligibleFixture();
    const createdResponse = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          fixtureId: fixture.id,
          selectedOutcome: "HOME",
        },
      }),
    );
    const createdBody = (await responseJson(createdResponse)) as {
      predictionId: string;
    };

    await prisma.fixture.update({
      where: { id: fixture.id },
      data: {
        status: "SETTLED",
        homeScore: 0,
        awayScore: 1,
        finalOutcome: "AWAY",
      },
    });
    await prisma.prediction.update({
      where: { id: createdBody.predictionId },
      data: {
        resultStatus: "INCORRECT",
        earnedPoints: 0,
        settledAt: new Date(),
      },
    });

    const todayPredictionsResponse = await getTodayPredictions(
      createApiRequest("/api/predictions/today", initData),
    );
    const todayPredictionsBody = (await responseJson(
      todayPredictionsResponse,
    )) as {
      predictions: Array<{
        id: string;
        resultStatus: string;
        fixture: {
          id: string;
          status: string;
          winningOutcome: string | null;
          competition: { id: string; code: string; name: string; slug: string };
          homeTeam: { id: string; name: string; slug: string };
          awayTeam: { id: string; name: string; slug: string };
          outcomes: {
            home: { points: number };
            draw: { points: number };
            away: { points: number };
          };
        };
      }>;
    };

    expect(todayPredictionsResponse.status).toBe(200);
    expect(todayPredictionsBody.predictions).toContainEqual(
      expect.objectContaining({
        id: createdBody.predictionId,
        resultStatus: "INCORRECT",
        fixture: expect.objectContaining({
          id: fixture.id,
          status: "SETTLED",
          winningOutcome: "AWAY",
          competition: expect.objectContaining({ code: "EPL" }),
          homeTeam: expect.objectContaining({ id: fixture.homeTeamId }),
          awayTeam: expect.objectContaining({ id: fixture.awayTeamId }),
          outcomes: {
            home: { points: 13 },
            draw: { points: 24 },
            away: { points: 27 },
          },
        }),
      }),
    );
  });

  it("creates Monetag reward sessions only for authenticated eligible users", async () => {
    const initData = signedInitData({ id: "777000111230" });
    const targetFixture = await createHttpEligibleFixture();
    const missingAuthResponse = await createMonetagSession(
      createApiRequest("/api/ad-rewards/monetag/sessions", "", {
        method: "POST",
        body: { fixtureId: targetFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const earlyResponse = await createMonetagSession(
      createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
        method: "POST",
        body: { fixtureId: targetFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const earlyBody = (await responseJson(earlyResponse)) as {
      error: { code: string };
    };

    expect(missingAuthResponse.status).toBe(401);
    expect(earlyResponse.status).toBe(400);
    expect(earlyBody.error.code).toBe("AD_REWARD_NOT_ELIGIBLE");

    await exhaustFreePredictions(initData);

    const sessionResponse = await createMonetagSession(
      createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
        method: "POST",
        body: { fixtureId: targetFixture.id, selectedOutcome: "AWAY" },
      }),
    );
    const sessionBody = (await responseJson(sessionResponse)) as {
      adRewardId: string;
      ymid: string;
      zoneId: string;
      requestVar: string;
      status: string;
    };
    const dbReward = await prisma.adReward.findUniqueOrThrow({
      where: { id: sessionBody.adRewardId },
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({
      where: { userId: dbReward.userId },
    });

    expect(sessionResponse.status).toBe(201);
    expect(sessionBody).toMatchObject({
      zoneId: "1234567",
      requestVar: "matches_extra_prediction",
      status: "CREATED",
    });
    expect(sessionBody.ymid).not.toBe(dbReward.userId);
    expect(dbReward.status).toBe("CREATED");
    expect(dbReward.verifiedAt).toBeNull();
    expect(dbReward.metadata).toEqual({
      fixtureId: targetFixture.id,
      selectedOutcome: "AWAY",
    });
    expect(usage.rewardedUsed).toBe(0);
  });

  it("confirms Monetag SDK Promise sessions idempotently and consumes one extra prediction", async () => {
    const initData = signedInitData({ id: "777000111231" });

    await exhaustFreePredictions(initData);

    const targetFixture = await createHttpEligibleFixture();
    const sessionResponse = await createMonetagSession(
      createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
        method: "POST",
        body: { fixtureId: targetFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const sessionBody = (await responseJson(sessionResponse)) as {
      adRewardId: string;
      ymid: string;
    };
    const confirmResponse = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${sessionBody.adRewardId}/confirm`,
        initData,
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: sessionBody.adRewardId }) },
    );
    const duplicateResponse = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${sessionBody.adRewardId}/confirm`,
        initData,
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: sessionBody.adRewardId }) },
    );
    const statusResponse = await getMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${sessionBody.adRewardId}`,
        initData,
      ),
      { params: Promise.resolve({ adRewardId: sessionBody.adRewardId }) },
    );
    const statusBody = (await responseJson(statusResponse)) as {
      status: string;
    };

    expect(confirmResponse.status).toBe(200);
    expect(duplicateResponse.status).toBe(200);
    expect(statusBody.status).toBe("VERIFIED");
    expect(
      await prisma.adReward.count({
        where: { ymid: sessionBody.ymid, status: "VERIFIED" },
      }),
    ).toBe(1);

    const createdPrediction = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          fixtureId: targetFixture.id,
          selectedOutcome: "HOME",
          adRewardId: sessionBody.adRewardId,
        },
      }),
    );
    const consumedReward = await prisma.adReward.findUniqueOrThrow({
      where: { id: sessionBody.adRewardId },
    });
    const usage = await prisma.dailyPredictionUsage.findFirstOrThrow({
      where: { userId: consumedReward.userId },
    });

    expect(createdPrediction.status).toBe(201);
    expect(consumedReward.status).toBe("CONSUMED");
    expect(consumedReward.consumedByPredictionId).not.toBeNull();
    expect(usage.rewardedUsed).toBe(1);

    const secondFixture = await createHttpEligibleFixture();
    const rejectedReuse = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          fixtureId: secondFixture.id,
          selectedOutcome: "DRAW",
          adRewardId: sessionBody.adRewardId,
        },
      }),
    );
    const rejectedReuseBody = (await responseJson(rejectedReuse)) as {
      error: { code: string };
    };

    expect(rejectedReuse.status).toBe(400);
    expect(rejectedReuseBody.error.code).toBe("AD_REWARD_ALREADY_CONSUMED");
  });

  it("rejects unauthorized, wrong-owner, expired and invalid Monetag confirms", async () => {
    const initData = signedInitData({ id: "777000111232" });
    const otherInitData = signedInitData({ id: "777000111233" });

    await exhaustFreePredictions(initData);
    await exhaustFreePredictions(otherInitData);

    const targetFixture = await createHttpEligibleFixture();
    const session = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: targetFixture.id, selectedOutcome: "HOME" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    const missingAuth = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${session.adRewardId}/confirm`,
        "",
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: session.adRewardId }) },
    );
    const wrongOwner = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${session.adRewardId}/confirm`,
        otherInitData,
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: session.adRewardId }) },
    );
    const wrongOwnerBody = (await responseJson(wrongOwner)) as {
      error: { code: string };
    };

    expect(missingAuth.status).toBe(401);
    expect(wrongOwner.status).toBe(400);
    expect(wrongOwnerBody.error.code).toBe("INVALID_AD_REWARD");
    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: session.adRewardId },
      }),
    ).toMatchObject({ status: "CREATED", verifiedAt: null });

    const expiredFixture = await createHttpEligibleFixture();
    const expiredSession = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: expiredFixture.id, selectedOutcome: "DRAW" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    await prisma.adReward.update({
      where: { id: expiredSession.adRewardId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expiredConfirm = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${expiredSession.adRewardId}/confirm`,
        initData,
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: expiredSession.adRewardId }) },
    );
    const expiredBody = (await responseJson(expiredConfirm)) as {
      error: { code: string };
    };

    expect(expiredConfirm.status).toBe(400);
    expect(expiredBody.error.code).toBe("INVALID_AD_REWARD");
    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: expiredSession.adRewardId },
      }),
    ).toMatchObject({ status: "EXPIRED", verifiedAt: null });

    const invalidFixture = await createHttpEligibleFixture();
    const invalidSession = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: invalidFixture.id, selectedOutcome: "AWAY" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    await prisma.adReward.update({
      where: { id: invalidSession.adRewardId },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });

    const invalidConfirm = await confirmMonetagSession(
      createApiRequest(
        `/api/ad-rewards/monetag/sessions/${invalidSession.adRewardId}/confirm`,
        initData,
        { method: "POST" },
      ),
      { params: Promise.resolve({ adRewardId: invalidSession.adRewardId }) },
    );
    const invalidBody = (await responseJson(invalidConfirm)) as {
      error: { code: string };
    };

    expect(invalidConfirm.status).toBe(400);
    expect(invalidBody.error.code).toBe("INVALID_AD_REWARD");
    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: invalidSession.adRewardId },
      }),
    ).toMatchObject({ status: "REJECTED", verifiedAt: null });
  });

  it("confirms Monetag reward sessions safely under concurrency", async () => {
    const initData = signedInitData({ id: "777000111234" });

    await exhaustFreePredictions(initData);

    const targetFixture = await createHttpEligibleFixture();
    const session = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: targetFixture.id, selectedOutcome: "AWAY" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    const responses = await Promise.all([
      confirmMonetagSession(
        createApiRequest(
          `/api/ad-rewards/monetag/sessions/${session.adRewardId}/confirm`,
          initData,
          { method: "POST" },
        ),
        { params: Promise.resolve({ adRewardId: session.adRewardId }) },
      ),
      confirmMonetagSession(
        createApiRequest(
          `/api/ad-rewards/monetag/sessions/${session.adRewardId}/confirm`,
          initData,
          { method: "POST" },
        ),
        { params: Promise.resolve({ adRewardId: session.adRewardId }) },
      ),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(
      await prisma.adReward.count({
        where: { id: session.adRewardId, status: "VERIFIED" },
      }),
    ).toBe(1);
    expect(
      await prisma.dailyPredictionUsage.findFirstOrThrow({
        where: { user: { telegramUserId: 777000111234n } },
      }),
    ).toMatchObject({ rewardedUsed: 0 });
  });

  it("retires stale active Monetag sessions instead of reusing one ymid for multiple attempts", async () => {
    const initData = signedInitData({ id: "777000111235" });

    await exhaustFreePredictions(initData);

    const firstFixture = await createHttpEligibleFixture();
    const firstSession = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: firstFixture.id, selectedOutcome: "HOME" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };
    const secondFixture = await createHttpEligibleFixture();
    const secondSession = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: secondFixture.id, selectedOutcome: "AWAY" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    expect(secondSession.ymid).not.toBe(firstSession.ymid);
    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: firstSession.adRewardId },
      }),
    ).toMatchObject({ status: "REJECTED", verifiedAt: null });
    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: secondSession.adRewardId },
      }),
    ).toMatchObject({ status: "CREATED", verifiedAt: null });
  });

  it("does not expose a mutating Monetag postback authority route", async () => {
    const initData = signedInitData({ id: "777000111236" });

    await exhaustFreePredictions(initData);

    const targetFixture = await createHttpEligibleFixture();
    const session = (await responseJson(
      await createMonetagSession(
        createApiRequest("/api/ad-rewards/monetag/sessions", initData, {
          method: "POST",
          body: { fixtureId: targetFixture.id, selectedOutcome: "HOME" },
        }),
      ),
    )) as { adRewardId: string; ymid: string };

    expect(
      await prisma.adReward.findUniqueOrThrow({
        where: { id: session.adRewardId },
      }),
    ).toMatchObject({ status: "CREATED", verifiedAt: null });
    expect(
      await prisma.adReward.count({
        where: { ymid: session.ymid, status: "VERIFIED" },
      }),
    ).toBe(0);
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
    const rejectedFourthBody = (await responseJson(rejectedFourth)) as {
      error: { code: string };
    };

    expect(rejectedFourth.status).toBe(429);
    expect(rejectedFourthBody.error.code).toBe("REWARDED_AD_REQUIRED");

    const reward = await createTestAdReward(
      prisma,
      (
        await prisma.user.findUniqueOrThrow({
          where: { telegramUserId: 777000111226n },
        })
      ).id,
      { expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    );
    const rewardedFixture = await createHttpEligibleFixture();
    const created = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: {
          fixtureId: rewardedFixture.id,
          selectedOutcome: "HOME",
          adRewardId: reward.id,
        },
      }),
    );
    const createdBody = (await responseJson(created)) as {
      predictionId: string;
    };

    await prisma.fixture.update({
      where: { id: rewardedFixture.id },
      data: { kickoffAt: new Date(Date.now() - 1000) },
    });

    const locked = await patchPrediction(
      createApiRequest(
        `/api/predictions/${createdBody.predictionId}`,
        initData,
        {
          method: "PATCH",
          body: { selectedOutcome: "AWAY" },
        },
      ),
      { params: Promise.resolve({ predictionId: createdBody.predictionId }) },
    );
    const lockedBody = (await responseJson(locked)) as {
      error: { code: string };
    };

    expect(locked.status).toBe(423);
    expect(lockedBody.error.code).toBe("PREDICTION_LOCKED");
  });

  it("returns controlled domain errors for late or non-open prediction create", async () => {
    const initData = signedInitData({ id: "777000111227" });
    const competition = await createSupportedTestCompetition(prisma, "EPL");
    const lateFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(Date.now() - 1000),
    });

    await attachTestScoringSnapshot(prisma, lateFixture.id);

    const lateResponse = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: { fixtureId: lateFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const lateBody = (await responseJson(lateResponse)) as {
      error: { code: string };
    };

    expect(lateResponse.status).toBe(423);
    expect(lateBody.error.code).toBe("PREDICTION_LOCKED");

    const todayRange = getBusinessDayRangeUtc(getBusinessDate(new Date()));
    const lockedFixture = await createTestFixture(prisma, {
      competitionId: competition.id,
      kickoffAt: new Date(
        Math.max(
          Date.now() + 60 * 60 * 1000,
          todayRange.startUtc.getTime() + 12 * 60 * 60 * 1000,
        ),
      ),
    });

    await attachTestScoringSnapshot(prisma, lockedFixture.id);
    await prisma.fixture.update({
      where: { id: lockedFixture.id },
      data: { status: "LOCKED" },
    });

    const nonOpenResponse = await postPrediction(
      createApiRequest("/api/predictions", initData, {
        method: "POST",
        idempotencyKey: uniqueTestKey("idem"),
        body: { fixtureId: lockedFixture.id, selectedOutcome: "HOME" },
      }),
    );
    const nonOpenBody = (await responseJson(nonOpenResponse)) as {
      error: { code: string };
    };

    expect(nonOpenResponse.status).toBe(400);
    expect(nonOpenBody.error.code).toBe("FIXTURE_NOT_OPEN");
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
    kickoffAt: new Date(
      Math.max(
        Date.now() + 60 * 60 * 1000,
        todayRange.startUtc.getTime() + 12 * 60 * 60 * 1000,
      ),
    ),
  });

  await attachTestScoringSnapshot(prisma, fixture.id);

  return fixture;
}

async function exhaustFreePredictions(initData: string): Promise<void> {
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
}
