import type React from "react";

interface IAge18IconProps {
  className?: string;
}

const Age18Icon: React.FC<IAge18IconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="20" cy="20" r="15.5" stroke="currentColor" strokeWidth="2.4" />
    <text
      x="20"
      y="24"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="13"
      fontWeight="700"
    >
      18+
    </text>
  </svg>
);

export default Age18Icon;
