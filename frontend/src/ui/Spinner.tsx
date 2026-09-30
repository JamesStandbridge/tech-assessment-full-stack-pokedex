import type { JSX } from "react";

interface SpinnerProps {
  readonly label: string;
}

/** A polite live status; the rotation stops when the user prefers reduced motion. */
export function Spinner({ label }: SpinnerProps): JSX.Element {
  return (
    <div role="status" aria-live="polite" className="text-muted flex items-center gap-3 text-sm">
      <span
        aria-hidden="true"
        className="border-rule border-t-accent size-4 rounded-full border motion-safe:animate-spin"
      />
      <span className="catalogue">{label}</span>
    </div>
  );
}
