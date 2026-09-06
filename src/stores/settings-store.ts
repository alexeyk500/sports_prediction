"use client";

import { create } from "zustand";
import type { AppearanceMode, EffectiveTheme } from "@/lib/theme/theme";
import type { SupportedLocale } from "@/lib/i18n/locales";

export interface SettingsState {
  locale: SupportedLocale;
  appearance: AppearanceMode;
  effectiveTheme: EffectiveTheme;
  setSettings: (settings: { locale: SupportedLocale; appearance: AppearanceMode }) => void;
  setEffectiveTheme: (effectiveTheme: EffectiveTheme) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: "en",
  appearance: "system",
  effectiveTheme: "light",
  setSettings: (settings) => set(settings),
  setEffectiveTheme: (effectiveTheme) => set({ effectiveTheme }),
}));
