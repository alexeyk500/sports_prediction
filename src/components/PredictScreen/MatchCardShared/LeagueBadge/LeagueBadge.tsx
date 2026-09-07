import type React from "react";
import Badge from "../Badge/Badge";
import type { VisualBadge } from "../match-card-presentation";
import styles from "./LeagueBadge.module.css";

interface ILeagueBadgeProps {
  badge: VisualBadge;
}

const LeagueBadge: React.FC<ILeagueBadgeProps> = ({ badge }) => {
  return (
    <span className={styles.leagueIdentity}>
      <Badge badge={badge} size="small" />
      <span dir="auto">{badge.label}</span>
    </span>
  );
};

export default LeagueBadge;
