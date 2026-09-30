import type { JSX } from "react";
import { type Key, ToggleButton, ToggleButtonGroup } from "react-aria-components";

import { assertNever } from "../../domain/assertNever";
import { THEME_PREFERENCES, type ThemePreference } from "../../domain/theme";
import { useTheme } from "./useTheme";

const LABELS: Readonly<Record<ThemePreference, string>> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function Icon({ preference }: { readonly preference: ThemePreference }): JSX.Element {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "size-4 fill-none stroke-current stroke-2 [stroke-linecap:round]",
  } as const;
  switch (preference) {
    case "system":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case "light":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "dark":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      );
    default:
      return assertNever(preference);
  }
}

function chosen(keys: ReadonlySet<Key>): ThemePreference | undefined {
  return THEME_PREFERENCES.find((preference) => keys.has(preference));
}

/** Choose the system, light or dark theme; arrow keys move between the three. */
export function ThemeToggle(): JSX.Element {
  const { preference, choose } = useTheme();
  return (
    <ToggleButtonGroup
      aria-label="Theme"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[preference]}
      onSelectionChange={(keys) => {
        const next = chosen(keys);
        if (next !== undefined) choose(next);
      }}
      className="rounded-control border-line bg-panel pointer-events-auto flex gap-0.5 border p-0.5"
    >
      {THEME_PREFERENCES.map((option) => (
        <ToggleButton
          key={option}
          id={option}
          aria-label={LABELS[option]}
          className="rounded-control text-muted data-[hovered]:text-text data-[selected]:bg-panel-raised data-[selected]:text-text grid size-8 cursor-pointer place-items-center transition-colors"
        >
          <Icon preference={option} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
