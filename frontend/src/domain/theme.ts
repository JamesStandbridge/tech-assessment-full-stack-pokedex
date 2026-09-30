/** The colors the interface is drawn in. */
export type Theme = "light" | "dark";

/** What the user asked for: a theme, or whatever the operating system prefers. */
export type ThemePreference = "system" | Theme;

export const THEME_PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"];

/** A stored preference, read back; anything unknown means the system's. */
export function parsePreference(value: string | null): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? "system";
}

export function resolveTheme(choice: {
  readonly preference: ThemePreference;
  readonly system: Theme;
}): Theme {
  return choice.preference === "system" ? choice.system : choice.preference;
}
