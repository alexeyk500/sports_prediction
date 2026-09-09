import type React from "react";

interface IFreeParticipationIconProps {
  className?: string;
}

const FreeParticipationIcon: React.FC<IFreeParticipationIconProps> = ({
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
    <rect x="8" y="16" width="24" height="17" rx="1.5" />
    <path d="M20 16v17M7 16h26v-5H7v5Z" />
    <path d="M20 11c-1.6-4.6-4-6.5-6.2-6.5-2 0-3.3 1.2-3.3 3 0 2.2 2 3.5 5.3 3.5H20Z" />
    <path d="M20 11c1.6-4.6 4-6.5 6.2-6.5 2 0 3.3 1.2 3.3 3 0 2.2-2 3.5-5.3 3.5H20Z" />
  </svg>
);

export default FreeParticipationIcon;
