import type React from "react";

interface ILeaderboardIconProps {
  className?: string;
}

const LeaderboardIcon: React.FC<ILeaderboardIconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4 20V10h4v10" />
    <path d="M10 20V4h4v16" />
    <path d="M16 20v-7h4v7" />
    <path d="M3 20h18" />
  </svg>
);

export default LeaderboardIcon;
