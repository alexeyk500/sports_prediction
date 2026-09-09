import type React from "react";

interface ITermsSummaryTrophyIconProps {
  className?: string;
}

const TermsSummaryTrophyIcon: React.FC<ITermsSummaryTrophyIconProps> = ({
  className,
}) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M13 8h14v7a7 7 0 0 1-14 0V8Z" />
    <path d="M13 11H8v3a7 7 0 0 0 7 7" />
    <path d="M27 11h5v3a7 7 0 0 1-7 7" />
    <path d="M20 22v7" />
    <path d="M15 33h10" />
    <path d="M12 33h16" />
  </svg>
);

export default TermsSummaryTrophyIcon;
