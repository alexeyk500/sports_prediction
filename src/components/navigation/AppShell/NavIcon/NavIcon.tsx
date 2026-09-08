import type React from "react";
import type { NavItem } from "../app-shell-types";
import styles from "./NavIcon.module.css";

interface INavIconProps {
  item: NavItem;
}

const NavIcon: React.FC<INavIconProps> = ({ item }) => {
  return (
    <svg
      className={styles.navIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {item === "Matches" ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="m12 8.15 3.05 2.22-1.16 3.58h-3.78l-1.16-3.58L12 8.15Z" />
          <path d="M12 8.15V4.6" />
          <path d="m8.95 10.37-3.34-.96" />
          <path d="m15.05 10.37 3.34-.96" />
          <path d="m10.11 13.95-2.08 2.83" />
          <path d="m13.89 13.95 2.08 2.83" />
        </g>
      ) : null}
      {item === "Cup" ? (
        <path d="M7 4h10v3h3a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-.24A6.02 6.02 0 0 1 13 16.92V19h3v2H8v-2h3v-2.08A6.02 6.02 0 0 1 8.24 14H8a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1h3V4Zm10 5v2.82A3 3 0 0 0 19 9h-2ZM5 9a3 3 0 0 0 2 2.82V9H5Z" />
      ) : null}
      {item === "History" ? (
        <path d="M6 4h12a2 2 0 0 1 2 2v14l-3-1.6-2.8 1.6-2.7-1.6L8.8 20 6 18.4 4 19.5V6a2 2 0 0 1 2-2Zm2 4v2h8V8H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" />
      ) : null}
      {item === "Profile" ? (
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      ) : null}
    </svg>
  );
};

export default NavIcon;
