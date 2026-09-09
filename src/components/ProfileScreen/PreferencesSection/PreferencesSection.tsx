import { useRef, useState } from "react";
import type React from "react";
import type { AppearanceMode, SupportedLocale } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import AppearanceSelector from "./AppearanceSelector/AppearanceSelector";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import PreferenceBottomSheet from "./PreferenceBottomSheet/PreferenceBottomSheet";
import styles from "./PreferencesSection.module.css";

interface IPreferencesSectionProps {
  selectedLocale: SupportedLocale;
  appearance: AppearanceMode;
  pendingField: "locale" | "appearance" | null;
  onLocaleChange: (locale: SupportedLocale) => Promise<void>;
  onAppearanceChange: (appearance: AppearanceMode) => Promise<void>;
}

type ActiveSelector = "language" | "appearance";

const PreferencesSection: React.FC<IPreferencesSectionProps> = ({
  selectedLocale,
  appearance,
  pendingField,
  onLocaleChange,
  onAppearanceChange,
}) => {
  const { t } = useTranslation();
  const [activeSelector, setActiveSelector] = useState<ActiveSelector | null>(
    null,
  );
  const languageButtonRef = useRef<HTMLButtonElement | null>(null);
  const appearanceButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectionDisabled = pendingField !== null;

  function closeSelector(): void {
    const previousSelector = activeSelector;

    setActiveSelector(null);

    requestAnimationFrame(() => {
      if (previousSelector === "language") {
        languageButtonRef.current?.focus();
      } else if (previousSelector === "appearance") {
        appearanceButtonRef.current?.focus();
      }
    });
  }

  return (
    <section className={styles.section} aria-labelledby="profile-preferences">
      <h2 id="profile-preferences">{t("profile.preferences.section")}</h2>
      <div className={styles.panel}>
        <button
          ref={languageButtonRef}
          type="button"
          className={styles.row}
          disabled={selectionDisabled}
          aria-haspopup="dialog"
          aria-expanded={activeSelector === "language"}
          onClick={() => {
            setActiveSelector("language");
          }}
        >
          <span
            className={styles.iconBox}
            data-tone="language"
            aria-hidden="true"
          >
            <GlobeIcon />
          </span>
          <span className={styles.label}>{t("profile.languageLabel")}</span>
          <span className={styles.value}>
            {t(`settings.locales.${selectedLocale}`)}
          </span>
          <ChevronRightIcon />
        </button>
        <button
          ref={appearanceButtonRef}
          type="button"
          className={styles.row}
          disabled={selectionDisabled}
          aria-haspopup="dialog"
          aria-expanded={activeSelector === "appearance"}
          onClick={() => {
            setActiveSelector("appearance");
          }}
        >
          <span
            className={styles.iconBox}
            data-tone="appearance"
            aria-hidden="true"
          >
            <MoonIcon />
          </span>
          <span className={styles.label}>{t("profile.appearanceLabel")}</span>
          <span className={styles.value}>
            {t(`settings.appearance.${appearance}`)}
          </span>
          <ChevronRightIcon />
        </button>
      </div>
      {activeSelector === "language" ? (
        <PreferenceBottomSheet
          title={t("profile.preferences.selectLanguage")}
          closeLabel={t("profile.preferences.closeSelector")}
          onClose={closeSelector}
        >
          <LanguageSelector
            selectedLocale={selectedLocale}
            pending={pendingField !== null}
            onSelect={onLocaleChange}
            onClose={closeSelector}
          />
        </PreferenceBottomSheet>
      ) : null}
      {activeSelector === "appearance" ? (
        <PreferenceBottomSheet
          title={t("profile.preferences.selectAppearance")}
          closeLabel={t("profile.preferences.closeSelector")}
          onClose={closeSelector}
        >
          <AppearanceSelector
            appearance={appearance}
            pending={pendingField !== null}
            onSelect={onAppearanceChange}
            onClose={closeSelector}
          />
        </PreferenceBottomSheet>
      ) : null}
    </section>
  );
};

const GlobeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <path d="M4.8 9.3h14.4M4.8 14.7h14.4M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8M12 4c-2 2.2-3 4.9-3 8s1 5.8 3 8" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M18.7 14.5A7.7 7.7 0 0 1 9.5 5.3 8 8 0 1 0 18.7 14.5Z" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg
    className={styles.chevron}
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden="true"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export default PreferencesSection;
