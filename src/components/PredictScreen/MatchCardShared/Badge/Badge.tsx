"use client";

import { useState } from "react";
import type React from "react";
import { capitalizeTone, type VisualBadge } from "../match-card-presentation";
import styles from "./Badge.module.css";

interface IBadgeProps {
  badge: VisualBadge;
  size: "small" | "large";
}

const Badge: React.FC<IBadgeProps> = ({ badge, size }) => {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const badgeClass = size === "small" ? styles.badgeSmall : styles.badgeLarge;
  const dataUi = size === "small" ? "league-badge" : "team-badge";
  const logoFailed = badge.logoUrl !== undefined && failedLogoUrl === badge.logoUrl;

  if (badge.logoUrl && !logoFailed) {
    return (
      <span className={`${badgeClass} ${styles.badgeLogo}`} aria-hidden="true" data-ui={dataUi}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Tiny badge logos need native onError fallback for canonical local/CDN asset URLs. */}
        <img src={badge.logoUrl} alt="" onError={() => setFailedLogoUrl(badge.logoUrl ?? null)} />
      </span>
    );
  }

  return (
    <span
      className={`${badgeClass} ${styles[`badgeTone${capitalizeTone(badge.tone)}`]}`}
      aria-hidden="true"
      data-ui={dataUi}
      data-logo-fallback="true"
    >
      {badge.initials}
    </span>
  );
};

export default Badge;
