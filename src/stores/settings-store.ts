"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import {
  isAppearanceMode,
  type AppearanceMode,
  type EffectiveTheme,
} from "@/lib/theme/theme";

interface IUserSettings {
  locale: SupportedLocale;
  appearance: AppearanceMode;
}

export interface SettingsState {
  locale: SupportedLocale;
  appearance: AppearanceMode;
  effectiveTheme: EffectiveTheme;
  setSettings: (settings: IUserSettings) => void;
  setEffectiveTheme: (effectiveTheme: EffectiveTheme) => void;
  hydrateSettingsFromStorage: () => void;
}

export const SETTINGS_STORAGE_KEY = "goalstery-settings";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "en",
      appearance: "system",
      effectiveTheme: "light",
      setSettings: (settings) => set(settings),
      setEffectiveTheme: (effectiveTheme) => set({ effectiveTheme }),
      hydrateSettingsFromStorage: () => {
        if (typeof window === "undefined") {
          return;
        }

        const storedSettings = readStoredSettings(window.localStorage);

        if (storedSettings) {
          set(storedSettings);
        }
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      partialize: (state) => ({
        locale: state.locale,
        appearance: state.appearance,
      }),
    },
  ),
);

function readStoredSettings(storage: Storage): IUserSettings | null {
  try {
    const parsed = JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
    const state = parsed?.state;

    if (
      !isSupportedLocale(state?.locale) ||
      !isAppearanceMode(state?.appearance)
    ) {
      return null;
    }

    return {
      locale: state.locale,
      appearance: state.appearance,
    };
  } catch {
    return null;
  }
}
