import type React from "react";

interface IHelpCircleIconProps {
  className?: string;
}

const HelpCircleIcon: React.FC<IHelpCircleIconProps> = ({ className }) => (
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
    <path d="M9.8 9a2.4 2.4 0 0 1 4.7.7c0 1.8-2.5 2.1-2.5 4" />
    <path d="M12 17h.01" />
  </svg>
);

export default HelpCircleIcon;
