import type React from "react";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./TrophyValue.module.css";

interface ITrophyValueProps {
  value: number;
}

const TrophyValue: React.FC<ITrophyValueProps> = ({ value }) => {
  const { locale } = useTranslation();

  return (
    <span className={styles.trophyValue}>
      <TrophyIcon className={styles.trophyIcon} />
      <span data-ui="trophy-value">{formatLocalizedNumber(locale, value)}</span>
    </span>
  );
};

export default TrophyValue;
