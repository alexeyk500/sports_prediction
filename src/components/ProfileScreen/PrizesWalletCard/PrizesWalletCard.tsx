import type React from "react";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./PrizesWalletCard.module.css";

interface IPrizesWalletCardProps {
  onOpen: () => void;
}

const PrizesWalletCard: React.FC<IPrizesWalletCardProps> = ({ onOpen }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.section} aria-labelledby="profile-prizes-wallet">
      <h2 id="profile-prizes-wallet">{t("profile.prizesWallet.section")}</h2>
      <button type="button" className={styles.card} onClick={onOpen}>
        <span className={styles.iconBox} aria-hidden="true">
          <TrophyIcon className={styles.trophyIcon} />
        </span>
        <span className={styles.content}>
          <strong>{t("profile.prizesWallet.title")}</strong>
          <span>{t("profile.prizesWallet.subtitle")}</span>
        </span>
        <ChevronIcon className={styles.chevron} />
      </button>
    </section>
  );
};

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

export default PrizesWalletCard;
