import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  formatProfileDisplayName,
  formatTelegramUsername,
  initialsForProfileName,
} from "../profile-format";
import styles from "./ProfileIdentity.module.css";

interface IProfileIdentityProps {
  user: BootstrapResponse["user"];
}

const ProfileIdentity: React.FC<IProfileIdentityProps> = ({ user }) => {
  const { t } = useTranslation();
  const displayName = formatProfileDisplayName(user, t);
  const username = formatTelegramUsername(user.username);

  return (
    <section className={styles.identity} aria-label={t("profile.identity")}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} aria-hidden="true">
          {initialsForProfileName(displayName)}
        </div>
        <span className={styles.telegramBadge} aria-hidden="true">
          <TelegramMark />
        </span>
      </div>
      <h2 dir="auto">{displayName}</h2>
      {username ? <p dir="auto">{username}</p> : null}
    </section>
  );
};

const TelegramMark: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M20.9 4.22 17.74 19.1c-.24 1.05-.86 1.3-1.74.8l-4.8-3.54-2.32 2.23c-.26.26-.47.47-.96.47l.34-4.9 8.92-8.06c.39-.34-.08-.53-.6-.19L5.55 12.85.8 11.36c-1.03-.32-1.05-1.03.22-1.53L19.58 2.7c.86-.32 1.61.19 1.32 1.52Z" />
  </svg>
);

export default ProfileIdentity;
