import type React from "react";

interface IPrizeIconProps {
  className?: string;
}

const PrizeIcon: React.FC<IPrizeIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8.35H7.4c-1.45 0-2.4-.85-2.4-2.05 0-1.1.85-1.95 1.95-1.95 1.75 0 3.45 2.15 5.05 4Z" />
        <path d="M12 8.35h4.6c1.45 0 2.4-.85 2.4-2.05 0-1.1-.85-1.95-1.95-1.95-1.75 0-3.45 2.15-5.05 4Z" />
        <path d="M12 8.35V4.55" />
        <rect x="3.25" y="8.35" width="17.5" height="4.1" rx="1.35" />
        <path d="M4.65 12.45h14.7v6.35c0 .95-.75 1.7-1.7 1.7H6.35c-.95 0-1.7-.75-1.7-1.7v-6.35Z" />
        <path d="M12 8.35V20.5" />
      </g>
    </svg>
  );
};

export default PrizeIcon;
