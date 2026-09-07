import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./CupHeader.module.css";

const CupHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.header}>
      <h1>{t("navigation.cup")}</h1>
      <p>{t("cup.subtitle")}</p>
    </section>
  );
};

export default CupHeader;
