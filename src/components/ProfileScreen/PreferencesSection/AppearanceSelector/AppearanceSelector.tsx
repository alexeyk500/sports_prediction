import type React from "react";
import type { AppearanceMode } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { APPEARANCE_MODES } from "@/lib/theme/theme";
import styles from "./AppearanceSelector.module.css";

interface IAppearanceSelectorProps {
  appearance: AppearanceMode;
  pending: boolean;
  onSelect: (appearance: AppearanceMode) => Promise<void>;
  onClose: () => void;
}

const AppearanceSelector: React.FC<IAppearanceSelectorProps> = ({
  appearance,
  pending,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  async function handleSelect(nextAppearance: AppearanceMode): Promise<void> {
    if (nextAppearance === appearance) {
      onClose();
      return;
    }

    await onSelect(nextAppearance);
    onClose();
  }

  return (
    <div className={styles.options}>
      {APPEARANCE_MODES.map((mode) => {
        const selected = mode === appearance;

        return (
          <button
            key={mode}
            type="button"
            className={styles.option}
            data-selected={selected ? "true" : undefined}
            aria-pressed={selected}
            disabled={pending}
            onClick={() => {
              void handleSelect(mode).catch(() => undefined);
            }}
          >
            <span
              className={styles.iconBox}
              data-mode={mode}
              aria-hidden="true"
            >
              <AppearanceIcon mode={mode} />
            </span>
            <span className={styles.copy}>
              <span className={styles.label}>
                {t(`settings.appearance.${mode}`)}
              </span>
              <span className={styles.description}>
                {t(`profile.preferences.appearanceDescriptions.${mode}`)}
              </span>
            </span>
            {selected ? (
              <span className={styles.checkBadge} aria-hidden="true">
                <CheckIcon />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

interface IAppearanceIconProps {
  mode: AppearanceMode;
}

const AppearanceIcon: React.FC<IAppearanceIconProps> = ({ mode }) => {
  if (mode === "light") {
    return <LightIcon />;
  }

  if (mode === "dark") {
    return <DarkIcon />;
  }

  return <SystemIcon />;
};

const SystemIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="4" y="5" width="16" height="11" rx="1.8" />
    <path d="M9 20h6" />
    <path d="M12 16v4" />
  </svg>
);

const LightIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2" />
    <path d="M12 19.5v2" />
    <path d="m5.3 5.3 1.4 1.4" />
    <path d="m17.3 17.3 1.4 1.4" />
    <path d="M2.5 12h2" />
    <path d="M19.5 12h2" />
    <path d="m5.3 18.7 1.4-1.4" />
    <path d="m17.3 6.7 1.4-1.4" />
  </svg>
);

const DarkIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M19.2 15.2A7.8 7.8 0 0 1 8.8 4.8a7.8 7.8 0 1 0 10.4 10.4Z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="m6.5 12.5 3.3 3.3 7.7-8" />
  </svg>
);

export default AppearanceSelector;
