import type { JSX } from "react";

interface ChipProps {
  readonly label: string;
  /** CSS colour of the border and the marker, such as var(--color-tone-stat). */
  readonly color: string;
  /** Extra words for assistive technologies, such as the meaning of the chip. */
  readonly description?: string;
  /** A dashed border marks something set aside, such as an ignored term. */
  readonly dashed?: boolean;
}

export function Chip({ label, color, description, dashed = false }: ChipProps): JSX.Element {
  return (
    <span
      className={`rounded-control bg-ink text-text inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs ${
        dashed ? "border-dashed line-through decoration-1" : "border-solid"
      }`}
      style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }}
    >
      <span aria-hidden="true" className="size-1.5 rotate-45" style={{ backgroundColor: color }} />
      {label}
      {description === undefined ? null : <span className="sr-only">{description}</span>}
    </span>
  );
}
