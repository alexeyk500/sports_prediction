import type React from "react";
import styles from "./VideoIcon.module.css";

const VideoIcon: React.FC = () => {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v1.23l2.27-1.36A1.15 1.15 0 0 1 21 7.35v9.3a1.15 1.15 0 0 1-1.73.98L17 16.27v1.23a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Zm5.4 2.15a.9.9 0 0 0-1.4.75v5.2a.9.9 0 0 0 1.4.75l3.9-2.6a.9.9 0 0 0 0-1.5l-3.9-2.6Z" />
    </svg>
  );
};

export default VideoIcon;
