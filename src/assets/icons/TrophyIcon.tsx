import type React from "react";

interface ITrophyIconProps {
  className?: string;
}

const TrophyIcon: React.FC<ITrophyIconProps> = ({ className }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h10v3h3a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-.24A6.02 6.02 0 0 1 13 16.92V19h3v2H8v-2h3v-2.08A6.02 6.02 0 0 1 8.24 14H8a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1h3V4Zm10 5v2.82A3 3 0 0 0 19 9h-2ZM5 9a3 3 0 0 0 2 2.82V9H5Z" />
    </svg>
  );
};

export default TrophyIcon;
