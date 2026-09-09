import { useEffect, useId, useRef } from "react";
import type React from "react";
import styles from "./PreferenceBottomSheet.module.css";

interface IPreferenceBottomSheetProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}

const PreferenceBottomSheet: React.FC<IPreferenceBottomSheetProps> = ({
  title,
  closeLabel,
  onClose,
  children,
}) => {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sheetRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <h3 id={titleId}>{title}</h3>
          <button
            type="button"
            className={styles.closeButton}
            aria-label={closeLabel}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export default PreferenceBottomSheet;
