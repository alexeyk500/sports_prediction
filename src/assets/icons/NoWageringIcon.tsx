import type React from "react";

interface INoWageringIconProps {
  className?: string;
}

const NoWageringIcon: React.FC<INoWageringIconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="20" cy="20" r="15.5" />
    <path d="M9 31 31 9" />
  </svg>
);

export default NoWageringIcon;
