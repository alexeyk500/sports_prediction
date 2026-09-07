import type React from "react";
import styles from "./LockIcon.module.css";

const LockIcon: React.FC = () => {
  return (
    <svg className={styles.statusIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17h-2v-1.27a2 2 0 1 1 2 0Z" />
    </svg>
  );
};

export default LockIcon;
