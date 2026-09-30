import type { JSX } from "react";
import { type Key, ToggleButton, ToggleButtonGroup } from "react-aria-components";

import { assertNever } from "../../domain/assertNever";
import { MOTION_PREFERENCES, type MotionPreference } from "../../domain/motion";
import { useMotion } from "./useMotion";

const LABELS: Readonly<Record<MotionPreference, string>> = {
  system: "System",
  animated: "Animated",
  still: "Still",
};

function motionKey(preference: MotionPreference): string {
  return `motion-${preference}`;
}

function Icon({ preference }: { readonly preference: MotionPreference }): JSX.Element {
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
    case "animated":
      return (
        <svg {...common}>
          <path d="M4 15a8 8 0 0 1 16 0" />
          <path d="M7 15a5 5 0 0 1 10 0" />
        </svg>
      );
    case "still":
      return (
        <svg {...common}>
          <path d="M8 5v14M16 5v14" />
        </svg>
      );
    default:
      return assertNever(preference);
  }
}

function chosen(keys: ReadonlySet<Key>): MotionPreference | undefined {
  return MOTION_PREFERENCES.find((preference) => keys.has(motionKey(preference)));
}

/** Choose system, animated or still motion; choosing animated again retries a failed scene. */
export function MotionToggle(): JSX.Element {
  const { preference, choose } = useMotion();
  return (
    <ToggleButtonGroup
      aria-label="Motion"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[motionKey(preference)]}
      onSelectionChange={(keys) => {
        const next = chosen(keys);
        if (next !== undefined) choose(next);
      }}
      className="rounded-control border-line bg-panel pointer-events-auto flex gap-0.5 border p-0.5"
    >
      {MOTION_PREFERENCES.map((option) => (
        <ToggleButton
          key={option}
          id={motionKey(option)}
          aria-label={LABELS[option]}
          onPress={() => {
            choose(option);
          }}
          className="rounded-control text-muted data-[hovered]:text-text data-[selected]:bg-panel-raised data-[selected]:text-text grid size-8 cursor-pointer place-items-center transition-colors"
        >
          <Icon preference={option} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
