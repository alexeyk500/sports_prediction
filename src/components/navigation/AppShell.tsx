"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSettingsRuntime } from "@/hooks/use-settings-runtime";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import styles from "./AppShell.module.css";

type NavItem = "Predict" | "Cup" | "Rating" | "Profile";

const navItems: NavItem[] = ["Predict", "Cup", "Rating", "Profile"];

export function AppShell({ predict }: { predict: ReactNode }) {
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
            {navLabel(item, t)}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <main className={styles.placeholder}>
      <h1>{title}</h1>
      <p>{t("navigation.placeholder")}</p>
    </main>
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
