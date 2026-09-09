"use client";

import { create } from "zustand";
import type {
  BootstrapResponse,
  CupHistoryResponse,
  CupLeaderboardPageResponse,
} from "@/lib/api/types";

type BootstrapLoadStatus = "idle" | "loading" | "error";
type CupTopLeaderboardLoadStatus = "idle" | "loading" | "loaded" | "error";
type CupHistoryLoadStatus = "idle" | "loading" | "loaded" | "error";

export interface ICupTopLeaderboardState {
  status: CupTopLeaderboardLoadStatus;
  data: CupLeaderboardPageResponse | null;
  error: unknown | null;
}

export interface ICupHistoryState {
  status: CupHistoryLoadStatus;
  data: CupHistoryResponse | null;
  error: unknown | null;
}

interface BootstrapState {
  bootstrap: BootstrapResponse | null;
  bootstrapLoadStatus: BootstrapLoadStatus;
  bootstrapLoadError: unknown | null;
  topLeaderboardByCupId: Record<string, ICupTopLeaderboardState>;
  historyByCupId: Record<string, ICupHistoryState>;
  setBootstrap: (bootstrap: BootstrapResponse | null) => void;
  beginBootstrapLoad: () => boolean;
  failBootstrapLoad: (error: unknown) => void;
  beginCupTopLeaderboardLoad: (cupId: string) => boolean;
  setCupTopLeaderboard: (
    cupId: string,
    data: CupLeaderboardPageResponse,
  ) => void;
  failCupTopLeaderboardLoad: (cupId: string, error: unknown) => void;
  beginCupHistoryLoad: (cupId: string) => boolean;
  setCupHistory: (cupId: string, data: CupHistoryResponse) => void;
  failCupHistoryLoad: (cupId: string, error: unknown) => void;
}

export const useBootstrapStore = create<BootstrapState>((set, get) => ({
  bootstrap: null,
  bootstrapLoadStatus: "idle",
  bootstrapLoadError: null,
  topLeaderboardByCupId: {},
  historyByCupId: {},
  setBootstrap: (bootstrap) =>
    set({
      bootstrap,
      bootstrapLoadStatus: "idle",
      bootstrapLoadError: null,
    }),
  beginBootstrapLoad: () => {
    const state = get();

    if (state.bootstrap || state.bootstrapLoadStatus === "loading") {
      return false;
    }

    set({
      bootstrapLoadStatus: "loading",
      bootstrapLoadError: null,
    });

    return true;
  },
  failBootstrapLoad: (error) =>
    set({
      bootstrapLoadStatus: "error",
      bootstrapLoadError: error,
    }),
  beginCupTopLeaderboardLoad: (cupId) => {
    const current = get().topLeaderboardByCupId[cupId];

    if (current?.status === "loading") {
      return false;
    }

    set((state) => ({
      topLeaderboardByCupId: {
        ...state.topLeaderboardByCupId,
        [cupId]: {
          status: "loading",
          data: current?.data ?? null,
          error: null,
        },
      },
    }));

    return true;
  },
  setCupTopLeaderboard: (cupId, data) =>
    set((state) => ({
      topLeaderboardByCupId: {
        ...state.topLeaderboardByCupId,
        [cupId]: {
          status: "loaded",
          data,
          error: null,
        },
      },
    })),
  failCupTopLeaderboardLoad: (cupId, error) =>
    set((state) => ({
      topLeaderboardByCupId: {
        ...state.topLeaderboardByCupId,
        [cupId]: {
          status: "error",
          data: state.topLeaderboardByCupId[cupId]?.data ?? null,
          error,
        },
      },
    })),
  beginCupHistoryLoad: (cupId) => {
    const current = get().historyByCupId[cupId];

    if (current?.status === "loading") {
      return false;
    }

    set((state) => ({
      historyByCupId: {
        ...state.historyByCupId,
        [cupId]: {
          status: "loading",
          data: current?.data ?? null,
          error: null,
        },
      },
    }));

    return true;
  },
  setCupHistory: (cupId, data) =>
    set((state) => ({
      historyByCupId: {
        ...state.historyByCupId,
        [cupId]: {
          status: "loaded",
          data,
          error: null,
        },
      },
    })),
  failCupHistoryLoad: (cupId, error) =>
    set((state) => ({
      historyByCupId: {
        ...state.historyByCupId,
        [cupId]: {
          status: "error",
          data: state.historyByCupId[cupId]?.data ?? null,
          error,
        },
      },
    })),
}));
