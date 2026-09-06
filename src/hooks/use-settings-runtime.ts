"use client";

import { useEffect } from "react";
import { directionForLocale } from "@/lib/i18n/locales";
import { resolveEffectiveTheme, type EffectiveTheme } from "@/lib/theme/theme";
import { useSettingsStore } from "@/stores/settings-store";

const darkSchemeQuery = "(prefers-color-scheme: dark)";

export function useSettingsRuntime(): void {
  const locale = useSettingsStore((state) => state.locale);
  const appearance = useSettingsStore((state) => state.appearance);
  const setEffectiveTheme = useSettingsStore((state) => state.setEffectiveTheme);

  useEffect(() => {
    const root = document.documentElement;

    root.lang = locale;
    root.dir = directionForLocale(locale);
  }, [locale]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(darkSchemeQuery);
    const applyTheme = () => {
      const systemTheme: EffectiveTheme = mediaQuery.matches ? "dark" : "light";
      const effectiveTheme = resolveEffectiveTheme(appearance, systemTheme);

      document.documentElement.dataset.theme = effectiveTheme;
      setEffectiveTheme(effectiveTheme);
    };

    applyTheme();

    if (appearance !== "system") {
      return;
    }

    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [appearance, setEffectiveTheme]);
}
