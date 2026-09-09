"use client";

import type React from "react";
import MoonIcon from "@/assets/icons/MoonIcon";
import SunIcon from "@/assets/icons/SunIcon";
import { useSettingsStore } from "@/stores/settings-store";
import styles from "./PublicPageShell.module.css";

const PublicThemeToggle: React.FC = () => {
  const effectiveTheme = useSettingsStore((state) => state.effectiveTheme);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const locale = useSettingsStore((state) => state.locale);

  const nextAppearance = effectiveTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={styles.themeButton}
      aria-label={`Switch to ${nextAppearance} theme`}
      onClick={() => setSettings({ locale, appearance: nextAppearance })}
    >
      {effectiveTheme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default PublicThemeToggle;
