import type React from "react";

interface IPeopleIconProps {
  className?: string;
}

const PeopleIcon: React.FC<IPeopleIconProps> = ({ className }) => {
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
        <circle cx="12" cy="7.25" r="2.5" />
        <path d="M7.85 17.6v-1.15c0-2.35 1.9-4.25 4.25-4.25h-.2c2.35 0 4.25 1.9 4.25 4.25v1.15" />
        <path d="M7.85 17.6h8.3" />
        <circle cx="5.85" cy="8.35" r="1.95" />
        <path d="M2.5 17.05v-.75c0-2.05 1.65-3.7 3.7-3.7h1.15" />
        <path d="M2.5 17.05h3.05" />
        <circle cx="18.15" cy="8.35" r="1.95" />
        <path d="M21.5 17.05v-.75c0-2.05-1.65-3.7-3.7-3.7h-1.15" />
        <path d="M18.45 17.05h3.05" />
      </g>
    </svg>
  );
};

export default PeopleIcon;
