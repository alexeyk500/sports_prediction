import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveEffectiveTheme } from "@/lib/theme/theme";

describe("resolveEffectiveTheme", () => {
  it("uses dark system preference in system mode", () => {
    expect(resolveEffectiveTheme("system", "dark")).toBe("dark");
  });

  it("uses light system preference in system mode", () => {
    expect(resolveEffectiveTheme("system", "light")).toBe("light");
  });

  it("keeps forced dark regardless of system preference", () => {
    expect(resolveEffectiveTheme("dark", "light")).toBe("dark");
  });

  it("keeps forced light regardless of system preference", () => {
    expect(resolveEffectiveTheme("light", "dark")).toBe("light");
  });

  it("defines semantic tokens for light and dark palettes", () => {
    const css = readFileSync(
      new URL("../../../src/app/globals.css", import.meta.url),
      "utf8",
    );

    expect(css).toContain("--color-app-bg");
    expect(css).toContain("--color-surface-elevated");
    expect(css).toContain("--color-accent");
    expect(css).toContain("--color-danger-bg");
    expect(css).toContain(':root[data-theme="dark"]');
  });
});
