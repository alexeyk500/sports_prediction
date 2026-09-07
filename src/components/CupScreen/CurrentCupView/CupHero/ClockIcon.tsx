import type React from "react";

interface IClockIconProps {
  className?: string;
}

const ClockIcon: React.FC<IClockIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5Zm1 4.75v4.04l3.1 1.86-1.03 1.72-4.07-2.44V7.5h2Z" />
    </svg>
  );
};

export default ClockIcon;
