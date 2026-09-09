import type React from "react";
import type { SupportedLocale } from "@/lib/api/types";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./LanguageSelector.module.css";

interface ILanguageSelectorProps {
  selectedLocale: SupportedLocale;
  pending: boolean;
  onSelect: (locale: SupportedLocale) => Promise<void>;
  onClose: () => void;
}

const LanguageSelector: React.FC<ILanguageSelectorProps> = ({
  selectedLocale,
  pending,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  async function handleSelect(locale: SupportedLocale): Promise<void> {
    if (locale === selectedLocale) {
      onClose();
      return;
    }

    await onSelect(locale);
    onClose();
  }

  return (
    <div className={styles.options}>
      {SUPPORTED_LOCALES.map((locale) => {
        const selected = locale === selectedLocale;

        return (
          <button
            key={locale}
            type="button"
            className={styles.option}
            data-selected={selected ? "true" : undefined}
            aria-pressed={selected}
            disabled={pending}
            onClick={() => {
              void handleSelect(locale).catch(() => undefined);
            }}
          >
            <span className={styles.optionText}>
              {t(`settings.locales.${locale}`)}
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

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="m6.5 12.5 3.3 3.3 7.7-8" />
  </svg>
);

export default LanguageSelector;
