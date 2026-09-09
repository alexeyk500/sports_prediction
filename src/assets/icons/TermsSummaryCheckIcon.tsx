import type React from "react";

interface ITermsSummaryCheckIconProps {
  className?: string;
}

const TermsSummaryCheckIcon: React.FC<ITermsSummaryCheckIconProps> = ({
  className,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);

export default TermsSummaryCheckIcon;
