import type { JSX } from "react";

interface SpinnerProps {
  readonly label: string;
}

/** A polite live status; its ink dot only pulses when motion is welcome. */
export function Spinner({ label }: SpinnerProps): JSX.Element {
  return (
    <div role="status" aria-live="polite" className="text-ink-soft flex items-center gap-3">
      <span
        aria-hidden="true"
        className="bg-rubric size-2 rounded-full motion-safe:animate-pulse"
      />
      <span className="label">{label}</span>
    </div>
  );
}
