import type React from "react";

interface IFootballIconProps {
  className?: string;
}

const FootballIcon: React.FC<IFootballIconProps> = ({ className }) => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2 12 7Z" />
    <path d="m9 9.2-3.5-1" />
    <path d="m15 9.2 3.5-1" />
    <path d="m10.1 12.7-2.2 3" />
    <path d="m13.9 12.7 2.2 3" />
    <path d="M7.9 15.7 8.5 19" />
    <path d="M16.1 15.7 15.5 19" />
  </svg>
);

export default FootballIcon;
