export const APPEARANCE_MODES = ["system", "light", "dark"] as const;

export type AppearanceMode = (typeof APPEARANCE_MODES)[number];
export type EffectiveTheme = "light" | "dark";

const appearanceModeSet = new Set<string>(APPEARANCE_MODES);

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return typeof value === "string" && appearanceModeSet.has(value);
}

export function resolveEffectiveTheme(
  appearance: AppearanceMode,
  systemTheme: EffectiveTheme,
): EffectiveTheme {
  return appearance === "system" ? systemTheme : appearance;
}
