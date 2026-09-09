import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMatchesDataOnce } from "@/components/MatchesScreen/hooks/useMatchesData";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useMatchesStore } from "@/stores/matches-store";
import type {
  BootstrapResponse,
  TodayFixturesResponse,
  TodayPredictionsResponse,
} from "@/lib/api/types";

describe("Matches data loading", () => {
  beforeEach(() => {
    useBootstrapStore.setState({
      bootstrap: null,
      bootstrapLoadStatus: "idle",
      bootstrapLoadError: null,
      topLeaderboardByCupId: {},
      historyByCupId: {},
    });
    useMatchesStore.setState({
      status: "idle",
      data: {
        fixtures: [],
        predictions: [],
        businessDate: null,
      },
      error: null,
    });
  });

  it("does not send a second request set for Strict Mode remount while loading", async () => {
    const apiClient = apiClientMock();
    const matchesStore = useMatchesStore.getState();
    const bootstrapStore = useBootstrapStore.getState();

    const first = loadMatchesDataOnce({
      apiClient,
      beginMatchesDataLoad: matchesStore.beginMatchesDataLoad,
      setBootstrap: bootstrapStore.setBootstrap,
      setMatchesData: matchesStore.setMatchesData,
      failMatchesDataLoad: matchesStore.failMatchesDataLoad,
    });
    const second = loadMatchesDataOnce({
      apiClient,
      beginMatchesDataLoad: matchesStore.beginMatchesDataLoad,
      setBootstrap: bootstrapStore.setBootstrap,
      setMatchesData: matchesStore.setMatchesData,
      failMatchesDataLoad: matchesStore.failMatchesDataLoad,
    });

    await Promise.all([first, second]);

    expect(apiClient.getBootstrap).toHaveBeenCalledTimes(1);
    expect(apiClient.getTodayFixtures).toHaveBeenCalledTimes(1);
    expect(apiClient.getTodayPredictions).toHaveBeenCalledTimes(1);
  });

  it("reloads after loaded on the next screen entry", async () => {
    const apiClient = apiClientMock();
    const matchesStore = useMatchesStore.getState();
    const bootstrapStore = useBootstrapStore.getState();
    const input = {
      apiClient,
      beginMatchesDataLoad: matchesStore.beginMatchesDataLoad,
      setBootstrap: bootstrapStore.setBootstrap,
      setMatchesData: matchesStore.setMatchesData,
      failMatchesDataLoad: matchesStore.failMatchesDataLoad,
    };

    await loadMatchesDataOnce(input);
    await loadMatchesDataOnce(input);

    expect(apiClient.getBootstrap).toHaveBeenCalledTimes(2);
    expect(apiClient.getTodayFixtures).toHaveBeenCalledTimes(2);
    expect(apiClient.getTodayPredictions).toHaveBeenCalledTimes(2);
  });

  it("allows retry after failure", async () => {
    const apiClient = {
      getBootstrap: vi
        .fn()
        .mockRejectedValueOnce(new Error("failed"))
        .mockResolvedValueOnce(bootstrap()),
      getTodayFixtures: vi.fn(() => Promise.resolve(fixtures())),
      getTodayPredictions: vi.fn(() => Promise.resolve(predictions())),
    };
    const matchesStore = useMatchesStore.getState();
    const bootstrapStore = useBootstrapStore.getState();
    const input = {
      apiClient,
      beginMatchesDataLoad: matchesStore.beginMatchesDataLoad,
      setBootstrap: bootstrapStore.setBootstrap,
      setMatchesData: matchesStore.setMatchesData,
      failMatchesDataLoad: matchesStore.failMatchesDataLoad,
    };

    await loadMatchesDataOnce(input);
    expect(useMatchesStore.getState().status).toBe("error");

    await loadMatchesDataOnce(input);

    expect(apiClient.getBootstrap).toHaveBeenCalledTimes(2);
    expect(useMatchesStore.getState().status).toBe("loaded");
  });
});

function apiClientMock() {
  return {
    getBootstrap: vi.fn(() => Promise.resolve(bootstrap())),
    getTodayFixtures: vi.fn(() => Promise.resolve(fixtures())),
    getTodayPredictions: vi.fn(() => Promise.resolve(predictions())),
  };
}

function bootstrap(): BootstrapResponse {
  return {
    user: {
      id: "user-1",
      telegramUserId: "900000001",
      username: "dev",
      firstName: "Dev",
      lastName: "User",
      languageCode: "en",
    },
    currentTournament: null,
    dailyPredictionUsage: {
      businessDate: "2026-09-09",
      freeUsed: 0,
      freeLimit: 3,
      rewardedUsed: 0,
      rewardedLimit: 5,
      totalUsed: 0,
      totalLimit: 8,
    },
    settings: {
      locale: "en",
      appearance: "system",
    },
    rating: null,
    cup: null,
    serverTime: "2026-09-09T00:00:00.000Z",
    businessTimezone: "Europe/Moscow",
  };
}

function fixtures(): TodayFixturesResponse {
  return {
    businessDate: "2026-09-09",
    fixtures: [],
  };
}

function predictions(): TodayPredictionsResponse {
  return {
    businessDate: "2026-09-09",
    predictions: [],
  };
}
