"use client";

import { create } from "zustand";
import type { PredictionDto, TodayFixtureDto } from "@/lib/api/types";

type MatchesDataLoadStatus = "idle" | "loading" | "loaded" | "error";

export interface IMatchesDataState {
  fixtures: TodayFixtureDto[];
  predictions: PredictionDto[];
  businessDate: string | null;
}

interface MatchesStoreState {
  status: MatchesDataLoadStatus;
  data: IMatchesDataState;
  error: unknown | null;
  beginMatchesDataLoad: () => boolean;
  setMatchesData: (data: IMatchesDataState) => void;
  failMatchesDataLoad: (error: unknown) => void;
  setTodayPredictions: (predictions: PredictionDto[]) => void;
}

const emptyMatchesData: IMatchesDataState = {
  fixtures: [],
  predictions: [],
  businessDate: null,
};

export const useMatchesStore = create<MatchesStoreState>((set, get) => ({
  status: "idle",
  data: emptyMatchesData,
  error: null,
  beginMatchesDataLoad: () => {
    if (get().status === "loading") {
      return false;
    }

    set({
      status: "loading",
      error: null,
    });

    return true;
  },
  setMatchesData: (data) =>
    set({
      status: "loaded",
      data,
      error: null,
    }),
  failMatchesDataLoad: (error) =>
    set({
      status: "error",
      error,
    }),
  setTodayPredictions: (predictions) =>
    set((state) => ({
      data: {
        ...state.data,
        predictions,
      },
    })),
}));
