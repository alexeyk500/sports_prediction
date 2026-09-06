"use client";

import { useMemo } from "react";
import { createTranslator } from "./i18n";
import { useSettingsStore } from "@/stores/settings-store";

export function useTranslation() {
  const locale = useSettingsStore((state) => state.locale);

  return useMemo(() => ({ t: createTranslator(locale), locale }), [locale]);
}
