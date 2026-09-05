"use client";

import { useState, type ReactNode } from "react";
import styles from "./AppShell.module.css";

type NavItem = "Predict" | "Cup" | "Rating" | "Profile";

const navItems: NavItem[] = ["Predict", "Cup", "Rating", "Profile"];

export function AppShell({ predict }: { predict: ReactNode }) {
  const [active, setActive] = useState<NavItem>("Predict");

  return (
    <div className={styles.shell}>
      <div className={styles.content}>{active === "Predict" ? predict : <Placeholder title={active} />}</div>
      <nav className={styles.nav} aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={active === item ? styles.activeNavButton : styles.navButton}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main className={styles.placeholder}>
      <h1>{title}</h1>
      <p>This section is not implemented in this stage.</p>
    </main>
  );
}
