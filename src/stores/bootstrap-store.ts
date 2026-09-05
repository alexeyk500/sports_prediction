"use client";

import { create } from "zustand";
import type { BootstrapResponse } from "@/lib/api/types";

interface BootstrapState {
  bootstrap: BootstrapResponse | null;
  setBootstrap: (bootstrap: BootstrapResponse | null) => void;
}

export const useBootstrapStore = create<BootstrapState>((set) => ({
  bootstrap: null,
  setBootstrap: (bootstrap) => set({ bootstrap }),
}));
