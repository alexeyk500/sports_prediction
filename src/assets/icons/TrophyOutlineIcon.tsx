import type React from "react";

interface ITrophyOutlineIconProps {
  className?: string;
}

const TrophyOutlineIcon: React.FC<ITrophyOutlineIconProps> = ({
  className,
}) => (
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
    <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H5v1a4 4 0 0 0 4 4" />
    <path d="M16 6h3v1a4 4 0 0 1-4 4" />
    <path d="M12 12v4" />
    <path d="M9 20h6" />
    <path d="M10 16h4" />
  </svg>
);

export default TrophyOutlineIcon;
