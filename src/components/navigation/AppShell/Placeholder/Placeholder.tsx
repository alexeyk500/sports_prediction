import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./Placeholder.module.css";

interface IPlaceholderProps {
  title: string;
}

const Placeholder: React.FC<IPlaceholderProps> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <main className={styles.placeholder}>
      <h1>{title}</h1>
      <p>{t("navigation.placeholder")}</p>
    </main>
  );
};

export default Placeholder;
