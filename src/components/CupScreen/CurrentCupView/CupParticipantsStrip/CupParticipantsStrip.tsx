import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { PeopleIcon } from "./PeopleIcon";
import styles from "./CupParticipantsStrip.module.css";

interface ICupParticipantsStripProps {
  participantCountLabel: string;
}

const CupParticipantsStrip: React.FC<ICupParticipantsStripProps> = ({ participantCountLabel }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.participantStrip}>
      <div className={styles.participantMetric}>
        <PeopleIcon className={styles.stripIcon} />
        <strong>{participantCountLabel}</strong>
        <span>{t("cup.participants")}</span>
      </div>
      <p>{t("cup.participantCopy")}</p>
    </section>
  );
};

export { CupParticipantsStrip };
