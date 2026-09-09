import type React from "react";

interface ITermsSummaryXIconProps {
  className?: string;
}

const TermsSummaryXIcon: React.FC<ITermsSummaryXIconProps> = ({
  className,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export default TermsSummaryXIcon;
