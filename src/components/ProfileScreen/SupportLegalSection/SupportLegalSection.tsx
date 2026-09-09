import type React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./SupportLegalSection.module.css";

const SupportLegalSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.section} aria-labelledby="profile-support-legal">
      <h2 id="profile-support-legal">{t("profile.supportLegal.section")}</h2>
      <div className={styles.panel}>
        <Link href="/help" className={styles.row}>
          <span className={styles.iconBox} data-tone="help" aria-hidden="true">
            <HeadsetIcon />
          </span>
          <span>{t("profile.supportLegal.help")}</span>
          <ChevronIcon className={styles.chevron} />
        </Link>
        <Link href="/privacy" className={styles.row}>
          <span
            className={styles.iconBox}
            data-tone="privacy"
            aria-hidden="true"
          >
            <DocumentIcon />
          </span>
          <span>{t("profile.supportLegal.privacy")}</span>
          <ChevronIcon className={styles.chevron} />
        </Link>
        <Link href="/terms" className={styles.row}>
          <span className={styles.iconBox} data-tone="terms" aria-hidden="true">
            <ShieldIcon />
          </span>
          <span>{t("profile.supportLegal.terms")}</span>
          <ChevronIcon className={styles.chevron} />
        </Link>
      </div>
    </section>
  );
};

const HeadsetIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
    <path d="M5 13h2.4v5H6a1 1 0 0 1-1-1v-4ZM19 13h-2.4v5H18a1 1 0 0 0 1-1v-4ZM16 18c-.8 1.3-2.1 2-4 2" />
  </svg>
);

const DocumentIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M7 3.5h7l3 3V20a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 7 20V3.5Z" />
    <path d="M14 3.5v3h3M9.5 11h5M9.5 14h5M9.5 17h3" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 3.5 18 6v4.5c0 4-2.25 7.25-6 9.5-3.75-2.25-6-5.5-6-9.5V6l6-2.5Z" />
    <path d="m9.4 12.2 1.7 1.7 3.7-4" />
  </svg>
);

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden="true"
  >
    <path
      d="m9 5 7 7-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SupportLegalSection;
