import type { JSX } from "react";

interface BarProps {
  readonly label: string;
  readonly value: number;
  /** Position of the value on the scale, from 0 to 1. */
  readonly share: number;
  readonly color: string;
}

/**
 * A labelled value drawn as a dot on a ruled scale; assistive technologies
 * read it as a meter. The stem grows with an animation that reduced motion
 * turns off.
 */
export function Bar({ label, value, share, color }: BarProps): JSX.Element {
  const clamped = Math.min(Math.max(share, 0), 1);
  const maximum = clamped > 0 ? Math.round(value / clamped) : value;
  const position = `${String(clamped * 100)}%`;
  return (
    <div className="flex items-center gap-3">
      <span className="label text-ink-soft w-16 shrink-0">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(maximum, value)}
        className="relative h-3 flex-1"
      >
        <span aria-hidden="true" className="bg-rule absolute inset-x-0 top-1/2 h-px" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-px origin-left motion-safe:animate-[grow_700ms_ease-out]"
          style={{ width: position, backgroundColor: color }}
        />
        <span
          aria-hidden="true"
          className="border-paper absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ left: position, backgroundColor: color }}
        />
      </div>
      <span className="folio w-9 text-right">{value}</span>
    </div>
  );
}
