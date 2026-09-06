"use client";

import { useMemo, useState } from "react";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { AppearanceMode, SupportedLocale, UserSettingsDto } from "@/lib/api/types";
import { APPEARANCE_MODES } from "@/lib/theme/theme";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useSettingsStore } from "@/stores/settings-store";
import styles from "./ProfileScreen.module.css";

export function ProfileScreen() {
  const bootstrap = useBootstrapStore((state) => state.bootstrap);
  const setBootstrap = useBootstrapStore((state) => state.setBootstrap);
  const selectedLocale = useSettingsStore((state) => state.locale);
  const appearance = useSettingsStore((state) => state.appearance);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [pendingField, setPendingField] = useState<"locale" | "appearance" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function updateSettings(patch: Partial<UserSettingsDto>, field: "locale" | "appearance"): Promise<void> {
    setPendingField(field);
    setErrorMessage(null);

    try {
      const settings = await apiClient.updateSettings(patch);

      setSettings(settings);
      if (bootstrap) {
        setBootstrap({ ...bootstrap, settings });
      }
    } catch (error) {
      setErrorMessage(messageForApiError(error, locale));
    } finally {
      setPendingField(null);
    }
  }

  return (
    <main className={styles.screen}>
      <section className={styles.header}>
        <h1>{t("profile.title")}</h1>
        <p>{t("profile.stagePlaceholder")}</p>
      </section>

      <section className={styles.settingsPanel}>
        <h2>{t("profile.settingsTitle")}</h2>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

        <label className={styles.field}>
          <span>{t("profile.languageLabel")}</span>
          <select
            value={selectedLocale}
            disabled={pendingField !== null}
            onChange={(event) => void updateSettings({ locale: event.target.value as SupportedLocale }, "locale")}
          >
            {SUPPORTED_LOCALES.map((option) => (
              <option key={option} value={option}>
                {t(`settings.locales.${option}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{t("profile.appearanceLabel")}</span>
          <select
            value={appearance}
            disabled={pendingField !== null}
            onChange={(event) =>
              void updateSettings({ appearance: event.target.value as AppearanceMode }, "appearance")
            }
          >
            {APPEARANCE_MODES.map((option) => (
              <option key={option} value={option}>
                {t(`settings.appearance.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </section>
    </main>
  );
}
