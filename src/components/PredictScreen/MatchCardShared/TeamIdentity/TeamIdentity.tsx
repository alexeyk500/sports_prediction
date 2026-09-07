import type React from "react";
import Badge from "../Badge/Badge";
import type { VisualBadge } from "../match-card-presentation";
import styles from "./TeamIdentity.module.css";

interface ITeamIdentityProps {
  badge: VisualBadge;
  name: string;
}

const TeamIdentity: React.FC<ITeamIdentityProps> = ({ badge, name }) => {
  return (
    <span className={styles.teamIdentity}>
      <Badge badge={badge} size="large" />
      <span className={styles.teamName} dir="auto">
        {name}
      </span>
    </span>
  );
};

export default TeamIdentity;
