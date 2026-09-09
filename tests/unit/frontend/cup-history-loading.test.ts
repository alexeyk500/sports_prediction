import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCupHistoryOnce } from "@/components/HistoryScreen/hooks/useCupHistory";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import type { CupHistoryResponse } from "@/lib/api/types";

describe("Cup history loading", () => {
  beforeEach(() => {
    useBootstrapStore.setState({
      bootstrap: null,
      bootstrapLoadStatus: "idle",
      bootstrapLoadError: null,
      topLeaderboardByCupId: {},
      historyByCupId: {},
    });
  });

  it("does not send a second request for Strict Mode remount while loading", async () => {
    const apiClient = {
      getCupHistory: vi.fn(() => Promise.resolve(history("cup-1"))),
    };
    const store = useBootstrapStore.getState();

    const first = loadCupHistoryOnce({
      cupId: "cup-1",
      apiClient,
      beginCupHistoryLoad: store.beginCupHistoryLoad,
      setCupHistory: store.setCupHistory,
      failCupHistoryLoad: store.failCupHistoryLoad,
    });
    const second = loadCupHistoryOnce({
      cupId: "cup-1",
      apiClient,
      beginCupHistoryLoad: store.beginCupHistoryLoad,
      setCupHistory: store.setCupHistory,
      failCupHistoryLoad: store.failCupHistoryLoad,
    });

    await Promise.all([first, second]);

    expect(apiClient.getCupHistory).toHaveBeenCalledTimes(1);
    expect(apiClient.getCupHistory).toHaveBeenCalledWith({ cupId: "cup-1" });
  });

  it("reloads a loaded Cup on the next screen entry and loads a new Cup separately", async () => {
    const apiClient = {
      getCupHistory: vi.fn(({ cupId }: { cupId: string }) =>
        Promise.resolve(history(cupId)),
      ),
    };
    const store = useBootstrapStore.getState();
    const input = {
      apiClient,
      beginCupHistoryLoad: store.beginCupHistoryLoad,
      setCupHistory: store.setCupHistory,
      failCupHistoryLoad: store.failCupHistoryLoad,
    };

    await loadCupHistoryOnce({ ...input, cupId: "cup-1" });
    await loadCupHistoryOnce({ ...input, cupId: "cup-1" });
    await loadCupHistoryOnce({ ...input, cupId: "cup-2" });

    expect(apiClient.getCupHistory).toHaveBeenCalledTimes(3);
    expect(apiClient.getCupHistory).toHaveBeenNthCalledWith(1, {
      cupId: "cup-1",
    });
    expect(apiClient.getCupHistory).toHaveBeenNthCalledWith(2, {
      cupId: "cup-1",
    });
    expect(apiClient.getCupHistory).toHaveBeenLastCalledWith({
      cupId: "cup-2",
    });
  });

  it("allows retry after failure", async () => {
    const apiClient = {
      getCupHistory: vi
        .fn()
        .mockRejectedValueOnce(new Error("failed"))
        .mockResolvedValueOnce(history("cup-1")),
    };
    const store = useBootstrapStore.getState();
    const input = {
      cupId: "cup-1",
      apiClient,
      beginCupHistoryLoad: store.beginCupHistoryLoad,
      setCupHistory: store.setCupHistory,
      failCupHistoryLoad: store.failCupHistoryLoad,
    };

    await loadCupHistoryOnce(input);
    expect(useBootstrapStore.getState().historyByCupId["cup-1"]?.status).toBe(
      "error",
    );

    await loadCupHistoryOnce(input);

    expect(apiClient.getCupHistory).toHaveBeenCalledTimes(2);
    expect(useBootstrapStore.getState().historyByCupId["cup-1"]?.status).toBe(
      "loaded",
    );
  });
});

function history(cupId: string): CupHistoryResponse {
  return {
    cupId,
    days: [],
  };
}
