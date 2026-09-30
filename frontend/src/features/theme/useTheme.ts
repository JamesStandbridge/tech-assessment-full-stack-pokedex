import { useEffect, useSyncExternalStore } from "react";

import {
  parsePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "../../domain/theme";
import { LIGHT_QUERY, THEME_STORAGE_KEY } from "./boot";

const choices = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  const media = window.matchMedia(LIGHT_QUERY);
  const onStorage = (event: StorageEvent): void => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) listener();
  };
  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);
  choices.add(listener);
  return () => {
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
    choices.delete(listener);
  };
}

/** Local storage may be refused, as in private windows; the choice then lasts for the page only. */
let unstored: ThemePreference = "system";

function storedPreference(): ThemePreference {
  try {
    return parsePreference(window.localStorage.getItem(THEME_STORAGE_KEY) ?? unstored);
  } catch (error) {
    if (error instanceof DOMException) return unstored;
    throw error;
  }
}

function storePreference(preference: ThemePreference): void {
  unstored = preference;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
  for (const listener of choices) listener();
}

function systemTheme(): Theme {
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

export interface ThemeControl {
  readonly preference: ThemePreference;
  /** The theme drawn: the preference, or the system's while the preference is "system". */
  readonly theme: Theme;
  readonly choose: (preference: ThemePreference) => void;
}

/** The theme preference of the device, following the system live while it is "system" (SYS-UI-032). */
export function useTheme(): ThemeControl {
  const preference = useSyncExternalStore(subscribe, storedPreference);
  const system = useSyncExternalStore(subscribe, systemTheme);
  return { preference, theme: resolveTheme({ preference, system }), choose: storePreference };
}

/** Keep the root element on the resolved theme, which every color token follows. */
export function useDocumentTheme(): void {
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);
}
