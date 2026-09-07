"use client";

import { useEffect, useState, type ReactNode } from "react";
import type React from "react";
import { useSettingsRuntime } from "@/hooks/use-settings-runtime";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useSettingsStore } from "@/stores/settings-store";
import CupScreen from "@/components/CupScreen/CupScreen";
import ProfileScreen from "@/components/profile/ProfileScreen";
import styles from "./AppShell.module.css";

type NavItem = "Predict" | "Cup" | "Rating" | "Profile";

const navItems: NavItem[] = ["Predict", "Cup", "Rating", "Profile"];

interface IAppShellProps {
  predict: ReactNode;
}

const AppShell: React.FC<IAppShellProps> = ({ predict }) => {
  const [active, setActive] = useState<NavItem>("Predict");
  const bootstrap = useBootstrapStore((state) => state.bootstrap);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const { t } = useTranslation();

  useSettingsRuntime();

  useEffect(() => {
    if (bootstrap) {
      setSettings(bootstrap.settings);
    }
  }, [bootstrap, setSettings]);

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        {active === "Predict" ? (
          predict
        ) : active === "Cup" ? (
          <CupScreen onMakePrediction={() => setActive("Predict")} />
        ) : active === "Profile" ? (
          <ProfileScreen />
        ) : (
          <Placeholder title={navLabel(active, t)} />
        )}
      </div>
      <nav className={styles.nav} aria-label={t("navigation.ariaLabel")}>
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={active === item ? styles.activeNavButton : styles.navButton}
            onClick={() => setActive(item)}
          >
            <NavIcon item={item} />
            <span>{navLabel(item, t)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;

function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <main className={styles.placeholder}>
      <h1>{title}</h1>
      <p>{t("navigation.placeholder")}</p>
    </main>
  );
}

function NavIcon({ item }: { item: NavItem }) {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {item === "Predict" ? (
        <>
          <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 2.2a6.3 6.3 0 0 1 3.43 1.02l-2.18 1.59h-2.5L8.57 6.72A6.3 6.3 0 0 1 12 5.7Zm-5.26 4.1 2.1 1.53.76 2.35-.8 2.45A6.27 6.27 0 0 1 6.74 9.8Zm5.26 8.5c-.7 0-1.37-.11-2-.32l.82-2.52 2-1.45 2 1.45.82 2.52c-.63.21-1.3.32-2 .32Zm3.2-6.97 2.1-1.53a6.27 6.27 0 0 1-2.06 6.33l-.8-2.45.76-2.35Zm-3.2-1.02h2.04l.63 1.94L12 14.2l-2.67-1.95.63-1.94H12Z" />
        </>
      ) : null}
      {item === "Cup" ? (
        <path d="M7 4h10v3h3a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-.24A6.02 6.02 0 0 1 13 16.92V19h3v2H8v-2h3v-2.08A6.02 6.02 0 0 1 8.24 14H8a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1h3V4Zm10 5v2.82A3 3 0 0 0 19 9h-2ZM5 9a3 3 0 0 0 2 2.82V9H5Z" />
      ) : null}
      {item === "Rating" ? (
        <path d="M5 11h3v9H5v-9Zm5.5-7h3v16h-3V4ZM16 8h3v12h-3V8Z" />
      ) : null}
      {item === "Profile" ? (
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      ) : null}
    </svg>
  );
}

function navLabel(item: NavItem, t: ReturnType<typeof useTranslation>["t"]): string {
  switch (item) {
    case "Predict":
      return t("navigation.predict");
    case "Cup":
      return t("navigation.cup");
    case "Rating":
      return t("navigation.rating");
    case "Profile":
      return t("navigation.profile");
  }
}
