import type React from "react";

interface INoMonetaryValueIconProps {
  className?: string;
}

const NoMonetaryValueIcon: React.FC<INoMonetaryValueIconProps> = ({
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
    <path d="M13 9h14v6.5a7 7 0 0 1-14 0V9Z" />
    <path d="M13 12H8.5v2.5A6.5 6.5 0 0 0 15 21" />
    <path d="M27 12h4.5v2.5A6.5 6.5 0 0 1 25 21" />
    <path d="M20 22.5V29" />
    <path d="M15 33h10" />
    <path d="M12 33h16" />
  </svg>
);

export default NoMonetaryValueIcon;
