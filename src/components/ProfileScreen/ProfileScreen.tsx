"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type {
  AppearanceMode,
  SupportedLocale,
  UserSettingsDto,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useSettingsStore } from "@/stores/settings-store";
import AppInfo from "./AppInfo/AppInfo";
import PreferencesSection from "./PreferencesSection/PreferencesSection";
import PrizesWalletCard from "./PrizesWalletCard/PrizesWalletCard";
import ProfileIdentity from "./ProfileIdentity/ProfileIdentity";
import SupportLegalSection from "./SupportLegalSection/SupportLegalSection";
import styles from "./ProfileScreen.module.css";

const ProfileScreen: React.FC = () => {
  const bootstrap = useBootstrapStore((state) => state.bootstrap);
  const setBootstrap = useBootstrapStore((state) => state.setBootstrap);
  const selectedLocale = useSettingsStore((state) => state.locale);
  const appearance = useSettingsStore((state) => state.appearance);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [pendingField, setPendingField] = useState<
    "locale" | "appearance" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateSettings(
    patch: Partial<UserSettingsDto>,
    field: "locale" | "appearance",
  ): Promise<void> {
    setPendingField(field);
    setMessage(null);

    try {
      const settings = await apiClient.updateSettings(patch);

      setSettings(settings);
      if (bootstrap) {
        setBootstrap({ ...bootstrap, settings });
      }
    } catch (error) {
      setMessage(messageForApiError(error, locale));
      throw error;
    } finally {
      setPendingField(null);
    }
  }

  function showPlaceholder(): void {
    setMessage(t("profile.destinationUnavailable"));
  }

  return (
    <main className={styles.screen}>
      <div className={styles.scrollArea} data-ui="profile-scroll-area">
        <header className={styles.header}>
          <h1>{t("profile.title")}</h1>
          <p>{t("profile.subtitle")}</p>
        </header>

        {bootstrap ? (
          <ProfileIdentity user={bootstrap.user} />
        ) : (
          <section className={styles.identityFallback}>
            <h2>{t("profile.identityUnavailable")}</h2>
            <p>{t("matches.authRequired")}</p>
          </section>
        )}

        {message ? <div className={styles.message}>{message}</div> : null}

        <div className={styles.sections}>
          <PrizesWalletCard onOpen={showPlaceholder} />
          <PreferencesSection
            selectedLocale={selectedLocale}
            appearance={appearance}
            pendingField={pendingField}
            onLocaleChange={(nextLocale: SupportedLocale) =>
              updateSettings({ locale: nextLocale }, "locale")
            }
            onAppearanceChange={(nextAppearance: AppearanceMode) =>
              updateSettings({ appearance: nextAppearance }, "appearance")
            }
          />
          <SupportLegalSection
            onOpenHelp={showPlaceholder}
            onOpenPrivacy={showPlaceholder}
            onOpenTerms={showPlaceholder}
          />
          <AppInfo />
        </div>
      </div>
    </main>
  );
};

export default ProfileScreen;
