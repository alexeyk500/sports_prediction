import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./Header.module.css";

interface IHeaderProps {
  bootstrap: BootstrapResponse;
}

const Header: React.FC<IHeaderProps> = ({ bootstrap }) => {
  const { t } = useTranslation();
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <section className={styles.header}>
      <div>
        <h1>{t("matches.title")}</h1>
        <p className={styles.subtitle}>{t("matches.subtitle")}</p>
      </div>
      {isDevelopment ? (
        <div className={styles.userBadge} dir="auto">
          {bootstrap.user.firstName ??
            bootstrap.user.username ??
            t("common.userFallback", { id: bootstrap.user.telegramUserId })}
        </div>
      ) : null}
    </section>
  );
};

export default Header;
