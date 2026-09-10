"use client";

import { useState } from "react";
import type React from "react";

import styles from "./MatchCardAmbientBackground.module.css";

interface IMatchCardAmbientBackgroundProps {
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  className?: string;
}

const MatchCardAmbientBackground: React.FC<
  IMatchCardAmbientBackgroundProps
> = ({ homeLogoUrl, awayLogoUrl, className }) => {
  const [failedLogoUrls, setFailedLogoUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const homeLogoAvailable =
    homeLogoUrl !== undefined && !failedLogoUrls.has(homeLogoUrl);
  const awayLogoAvailable =
    awayLogoUrl !== undefined && !failedLogoUrls.has(awayLogoUrl);

  if (!homeLogoAvailable && !awayLogoAvailable) {
    return null;
  }

  function handleLogoError(logoUrl: string): void {
    setFailedLogoUrls((current) => {
      const next = new Set(current);

      next.add(logoUrl);

      return next;
    });
  }

  return (
    <div
      className={`${styles.ambientBackground} ${className ?? ""}`}
      aria-hidden="true"
    >
      {homeLogoAvailable ? (
        // eslint-disable-next-line @next/next/no-img-element -- Decorative reuse of canonical team crest URL; native img allows silent broken-asset omission.
        <img
          className={`${styles.crest} ${styles.homeCrest}`}
          src={homeLogoUrl}
          alt=""
          draggable={false}
          onError={() => handleLogoError(homeLogoUrl)}
        />
      ) : null}
      {awayLogoAvailable ? (
        // eslint-disable-next-line @next/next/no-img-element -- Decorative reuse of canonical team crest URL; native img allows silent broken-asset omission.
        <img
          className={`${styles.crest} ${styles.awayCrest}`}
          src={awayLogoUrl}
          alt=""
          draggable={false}
          onError={() => handleLogoError(awayLogoUrl)}
        />
      ) : null}
    </div>
  );
};

export default MatchCardAmbientBackground;
