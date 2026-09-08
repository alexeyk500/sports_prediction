"use client";

import { useEffect, useState, type ReactNode } from "react";
import type React from "react";
import CupScreen from "@/components/CupScreen/CupScreen";
import HistoryScreen from "@/components/HistoryScreen/HistoryScreen";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { useSettingsRuntime } from "@/hooks/use-settings-runtime";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useSettingsStore } from "@/stores/settings-store";
import { navLabel } from "./app-shell-format";
import type { NavItem } from "./app-shell-types";
import NavIcon from "./NavIcon/NavIcon";
import styles from "./AppShell.module.css";

const navItems: NavItem[] = ["Matches", "Cup", "History", "Profile"];

interface IAppShellProps {
  matches: ReactNode;
}

const AppShell: React.FC<IAppShellProps> = ({ matches }) => {
  const [active, setActive] = useState<NavItem>("Matches");
  const bootstrap = useBootstrapStore((state) => state.bootstrap);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const { t } = useTranslation();

  useSettingsRuntime();

  useEffect(() => {
    if (bootstrap) {
      setSettings(bootstrap.settings);
    }
  }, [bootstrap, setSettings]);

  function renderActiveContent(): ReactNode {
    switch (active) {
      case "Matches":
        return matches;
      case "Cup":
        return <CupScreen onOpenMatches={() => setActive("Matches")} />;
      case "History":
        return <HistoryScreen />;
      case "Profile":
        return <ProfileScreen />;
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.content}>{renderActiveContent()}</div>
      <nav className={styles.nav} aria-label={t("navigation.ariaLabel")}>
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={
              active === item ? styles.activeNavButton : styles.navButton
            }
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
