import type React from "react";

interface ITelegramIconProps {
  className?: string;
}

const TelegramIcon: React.FC<ITelegramIconProps> = ({ className }) => (
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
    <path d="M21 4 3.8 10.6c-.9.3-.9 1.5 0 1.8l4.2 1.4 1.6 5c.3.8 1.3 1 1.8.4l2.3-2.7 4.1 3c.7.5 1.7.1 1.9-.8L22 5.2c.2-.9-.2-1.5-1-1.2Z" />
    <path d="m8 13.8 10-6.6" />
    <path d="m9.6 18.8.2-5.6 8.2-6" />
  </svg>
);

export default TelegramIcon;
