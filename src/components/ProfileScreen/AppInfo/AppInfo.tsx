import type React from "react";
import packageJson from "../../../../package.json";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./AppInfo.module.css";

const AppInfo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.appInfo} aria-label={t("profile.appInfo")}>
      <strong>{t("common.brand")}</strong>
      <span>{t("profile.version", { version: packageJson.version })}</span>
    </section>
  );
};

export default AppInfo;
