import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { UserIcon } from "./UserIcon";
import styles from "./UserCupPosition.module.css";

interface IUserCupPositionProps {
  onMakePrediction: () => void;
}

const UserCupPosition: React.FC<IUserCupPositionProps> = ({ onMakePrediction }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.positionPanel}>
      <div className={styles.positionAvatar} aria-hidden="true">
        <UserIcon className={styles.userIcon} />
      </div>
      <div className={styles.positionContent}>
        <span className={styles.panelLabel}>{t("cup.yourPosition")}</span>
        <h2>{t("cup.positionUnavailableTitle")}</h2>
        <p>{t("cup.positionUnavailableBody")}</p>
        <button className={styles.predictCta} type="button" onClick={onMakePrediction}>
          {t("cup.makePrediction")}
        </button>
      </div>
    </section>
  );
};

export { UserCupPosition };
