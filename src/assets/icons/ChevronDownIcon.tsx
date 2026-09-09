import type React from "react";

interface IChevronDownIconProps {
  className?: string;
}

const ChevronDownIcon: React.FC<IChevronDownIconProps> = ({ className }) => (
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
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default ChevronDownIcon;
