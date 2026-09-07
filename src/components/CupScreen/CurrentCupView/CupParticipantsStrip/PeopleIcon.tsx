import type React from "react";

interface IPeopleIconProps {
  className?: string;
}

const PeopleIcon: React.FC<IPeopleIconProps> = ({ className }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.5 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm7-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 19.5c0-3.04 2.91-5.5 6.5-5.5s6.5 2.46 6.5 5.5V20H2v-.5Zm13.2.5c.03-.17.05-.34.05-.5 0-1.62-.63-3.08-1.68-4.22A6.67 6.67 0 0 1 16.5 14c3.04 0 5.5 2.08 5.5 4.65V20h-6.8Z" />
    </svg>
  );
};

export { PeopleIcon };
