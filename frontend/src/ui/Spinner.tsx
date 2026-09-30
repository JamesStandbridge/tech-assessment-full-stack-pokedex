import type { JSX } from "react";

interface SpinnerProps {
  readonly label: string;
}

/** A polite live status; the rotation stops when the user prefers reduced motion. */
export function Spinner({ label }: SpinnerProps): JSX.Element {
  return (
    <div role="status" aria-live="polite" className="text-muted flex items-center gap-3">
      <span
        aria-hidden="true"
        className="border-line border-t-accent size-5 rounded-full border-2 motion-safe:animate-spin"
      />
      <span>{label}</span>
    </div>
  );
}
