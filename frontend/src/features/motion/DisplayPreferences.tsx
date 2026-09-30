import { type JSX, type ReactNode, useSyncExternalStore } from "react";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";

import { ThemeToggle } from "../theme/ThemeToggle";
import { MotionToggle } from "./MotionToggle";

const COMPACT_QUERY = "(width < 48rem)";

function subscribeCompact(listener: () => void): () => void {
  const media = window.matchMedia(COMPACT_QUERY);
  media.addEventListener("change", listener);
  return () => {
    media.removeEventListener("change", listener);
  };
}

function compactNow(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

function useCompactHeader(): boolean {
  return useSyncExternalStore(subscribeCompact, compactNow);
}

function InlinePreferences(): JSX.Element {
  return (
    <div className="flex gap-2">
      <MotionToggle />
      <ThemeToggle />
    </div>
  );
}

function DisplayIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round]"
    >
      <path d="M4 8h16M4 16h16" />
      <circle cx="9" cy="8" r="2" />
      <circle cx="15" cy="16" r="2" />
    </svg>
  );
}

function Preference(props: { readonly label: string; readonly children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <span aria-hidden="true" className="catalogue text-muted">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

function DisplayMenu(): JSX.Element {
  return (
    <DialogTrigger>
      <Button
        aria-label="Display"
        className="rounded-control border-line bg-panel text-muted data-[hovered]:text-text aria-expanded:bg-panel-raised aria-expanded:text-text pointer-events-auto grid size-8 cursor-pointer place-items-center border"
      >
        <DisplayIcon />
      </Button>
      <Popover placement="bottom end" offset={8} className="plate z-40 p-3 outline-none">
        <Dialog aria-label="Display" className="flex flex-col gap-3 outline-none">
          <Preference label="Motion">
            <MotionToggle />
          </Preference>
          <Preference label="Theme">
            <ThemeToggle />
          </Preference>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

/** Theme and motion sit in the header, folding into one menu when the row is short. */
export function DisplayPreferences(): JSX.Element {
  const compact = useCompactHeader();
  return compact ? <DisplayMenu /> : <InlinePreferences />;
}
