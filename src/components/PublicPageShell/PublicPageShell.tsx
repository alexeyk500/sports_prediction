import type React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import ArrowLeftIcon from "@/assets/icons/ArrowLeftIcon";
import PublicThemeRuntime from "@/components/PublicThemeRuntime/PublicThemeRuntime";
import PublicThemeToggle from "./PublicThemeToggle";
import styles from "./PublicPageShell.module.css";

interface IPublicPageShellProps {
  children: ReactNode;
}

const PublicPageShell: React.FC<IPublicPageShellProps> = ({ children }) => (
  <main className={styles.shell}>
    <PublicThemeRuntime />
    <div className={styles.scrollArea} data-ui="public-scroll-area">
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link
            href="/"
            className={styles.backLink}
            aria-label="Return to Goalstery"
          >
            <ArrowLeftIcon />
          </Link>
          <Link href="/" className={styles.brandLink}>
            Goalstery
          </Link>
          <PublicThemeToggle />
        </header>
        {children}
      </div>
    </div>
  </main>
);

export default PublicPageShell;
