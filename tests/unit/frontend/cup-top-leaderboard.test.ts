import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCupTopLeaderboardOnce } from "@/components/CupScreen/hooks/useCupTopLeaderboard";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import type { CupLeaderboardPageResponse } from "@/lib/api/types";

describe("Cup Top leaderboard loading", () => {
  beforeEach(() => {
    useBootstrapStore.setState({
      bootstrap: null,
      bootstrapLoadStatus: "idle",
      bootstrapLoadError: null,
      topLeaderboardByCupId: {},
    });
  });

  it("does not send a second request for Strict Mode remount while loading", async () => {
    const apiClient = {
      getCupLeaderboard: vi.fn(() => Promise.resolve(page())),
    };
    const store = useBootstrapStore.getState();

    const first = loadCupTopLeaderboardOnce({
      cupId: "cup-1",
      apiClient,
      beginCupTopLeaderboardLoad: store.beginCupTopLeaderboardLoad,
      setCupTopLeaderboard: store.setCupTopLeaderboard,
      failCupTopLeaderboardLoad: store.failCupTopLeaderboardLoad,
    });
    const second = loadCupTopLeaderboardOnce({
      cupId: "cup-1",
      apiClient,
      beginCupTopLeaderboardLoad: store.beginCupTopLeaderboardLoad,
      setCupTopLeaderboard: store.setCupTopLeaderboard,
      failCupTopLeaderboardLoad: store.failCupTopLeaderboardLoad,
    });

    await Promise.all([first, second]);

    expect(apiClient.getCupLeaderboard).toHaveBeenCalledTimes(1);
    expect(apiClient.getCupLeaderboard).toHaveBeenCalledWith({
      cupId: "cup-1",
      mode: "top",
      limit: 50,
    });
  });

  it("reloads a loaded Cup on the next screen entry and loads a new Cup separately", async () => {
    const apiClient = {
      getCupLeaderboard: vi.fn(() => Promise.resolve(page())),
    };
    const store = useBootstrapStore.getState();
    const input = {
      apiClient,
      beginCupTopLeaderboardLoad: store.beginCupTopLeaderboardLoad,
      setCupTopLeaderboard: store.setCupTopLeaderboard,
      failCupTopLeaderboardLoad: store.failCupTopLeaderboardLoad,
    };

    await loadCupTopLeaderboardOnce({ ...input, cupId: "cup-1" });
    await loadCupTopLeaderboardOnce({ ...input, cupId: "cup-1" });
    await loadCupTopLeaderboardOnce({ ...input, cupId: "cup-2" });

    expect(apiClient.getCupLeaderboard).toHaveBeenCalledTimes(3);
    expect(apiClient.getCupLeaderboard).toHaveBeenNthCalledWith(1, {
      cupId: "cup-1",
      mode: "top",
      limit: 50,
    });
    expect(apiClient.getCupLeaderboard).toHaveBeenNthCalledWith(2, {
      cupId: "cup-1",
      mode: "top",
      limit: 50,
    });
    expect(apiClient.getCupLeaderboard).toHaveBeenLastCalledWith({
      cupId: "cup-2",
      mode: "top",
      limit: 50,
    });
  });

  it("allows retry after failure", async () => {
    const apiClient = {
      getCupLeaderboard: vi
        .fn()
        .mockRejectedValueOnce(new Error("failed"))
        .mockResolvedValueOnce(page()),
    };
    const store = useBootstrapStore.getState();
    const input = {
      cupId: "cup-1",
      apiClient,
      beginCupTopLeaderboardLoad: store.beginCupTopLeaderboardLoad,
      setCupTopLeaderboard: store.setCupTopLeaderboard,
      failCupTopLeaderboardLoad: store.failCupTopLeaderboardLoad,
    };

    await loadCupTopLeaderboardOnce(input);
    expect(
      useBootstrapStore.getState().topLeaderboardByCupId["cup-1"]?.status,
    ).toBe("error");

    await loadCupTopLeaderboardOnce(input);

    expect(apiClient.getCupLeaderboard).toHaveBeenCalledTimes(2);
    expect(
      useBootstrapStore.getState().topLeaderboardByCupId["cup-1"]?.status,
    ).toBe("loaded");
  });
});

function page(): CupLeaderboardPageResponse {
  return {
    items: [],
    nextCursor: null,
    totalParticipants: 0,
  };
}
