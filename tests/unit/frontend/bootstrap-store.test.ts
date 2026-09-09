import { beforeEach, describe, expect, it } from "vitest";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import type {
  CupHistoryResponse,
  CupLeaderboardPageResponse,
} from "@/lib/api/types";
import { useMatchesStore } from "@/stores/matches-store";

describe("bootstrap store", () => {
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

  it("allows only one in-flight bootstrap load to begin", () => {
    expect(useBootstrapStore.getState().beginBootstrapLoad()).toBe(true);
    expect(useBootstrapStore.getState().beginBootstrapLoad()).toBe(false);
  });

  it("atomically starts one Top leaderboard load per Cup", () => {
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(true);
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(false);
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-2"),
    ).toBe(true);
  });

  it("stores loaded Top leaderboard and allows refresh on the next screen entry", () => {
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(true);

    useBootstrapStore.getState().setCupTopLeaderboard("cup-1", page());

    expect(
      useBootstrapStore.getState().topLeaderboardByCupId["cup-1"],
    ).toMatchObject({
      status: "loaded",
      data: page(),
      error: null,
    });
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(true);
    expect(
      useBootstrapStore.getState().topLeaderboardByCupId["cup-1"],
    ).toMatchObject({
      status: "loading",
      data: page(),
      error: null,
    });
  });

  it("allows retry after Top leaderboard failure", () => {
    const error = new Error("failed");

    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(true);
    useBootstrapStore.getState().failCupTopLeaderboardLoad("cup-1", error);

    expect(
      useBootstrapStore.getState().topLeaderboardByCupId["cup-1"],
    ).toMatchObject({
      status: "error",
      error,
    });
    expect(
      useBootstrapStore.getState().beginCupTopLeaderboardLoad("cup-1"),
    ).toBe(true);
  });

  it("atomically starts one History load per Cup", () => {
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      true,
    );
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      false,
    );
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-2")).toBe(
      true,
    );
  });

  it("stores loaded History and allows refresh on the next screen entry", () => {
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      true,
    );

    useBootstrapStore.getState().setCupHistory("cup-1", history());

    expect(useBootstrapStore.getState().historyByCupId["cup-1"]).toMatchObject({
      status: "loaded",
      data: history(),
      error: null,
    });
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      true,
    );
    expect(useBootstrapStore.getState().historyByCupId["cup-1"]).toMatchObject({
      status: "loading",
      data: history(),
      error: null,
    });
  });

  it("allows retry after History failure", () => {
    const error = new Error("failed");

    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      true,
    );
    useBootstrapStore.getState().failCupHistoryLoad("cup-1", error);

    expect(useBootstrapStore.getState().historyByCupId["cup-1"]).toMatchObject({
      status: "error",
      error,
    });
    expect(useBootstrapStore.getState().beginCupHistoryLoad("cup-1")).toBe(
      true,
    );
  });

  it("atomically starts one Matches data load", () => {
    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(true);
    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(false);
  });

  it("stores loaded Matches data and allows refresh on the next screen entry", () => {
    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(true);

    useMatchesStore.getState().setMatchesData({
      fixtures: [],
      predictions: [],
      businessDate: "2026-09-09",
    });

    expect(useMatchesStore.getState()).toMatchObject({
      status: "loaded",
      data: {
        businessDate: "2026-09-09",
      },
      error: null,
    });
    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(true);
    expect(useMatchesStore.getState()).toMatchObject({
      status: "loading",
      data: {
        businessDate: "2026-09-09",
      },
      error: null,
    });
  });

  it("allows retry after Matches data failure", () => {
    const error = new Error("failed");

    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(true);
    useMatchesStore.getState().failMatchesDataLoad(error);

    expect(useMatchesStore.getState()).toMatchObject({
      status: "error",
      error,
    });
    expect(useMatchesStore.getState().beginMatchesDataLoad()).toBe(true);
  });
});

function page(): CupLeaderboardPageResponse {
  return {
    items: [],
    nextCursor: null,
    totalParticipants: 0,
  };
}

function history(): CupHistoryResponse {
  return {
    cupId: "cup-1",
    days: [],
  };
}
