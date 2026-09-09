import { beforeEach, describe, expect, it } from "vitest";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import type { CupLeaderboardPageResponse } from "@/lib/api/types";

describe("bootstrap store", () => {
  beforeEach(() => {
    useBootstrapStore.setState({
      bootstrap: null,
      bootstrapLoadStatus: "idle",
      bootstrapLoadError: null,
      topLeaderboardByCupId: {},
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
});

function page(): CupLeaderboardPageResponse {
  return {
    items: [],
    nextCursor: null,
    totalParticipants: 0,
  };
}
