import type { JSX } from "react";

interface ChipProps {
  readonly label: string;
  /** CSS colour of the border and the dot, such as var(--color-tone-stat). */
  readonly color: string;
  /** Extra words for assistive technologies, such as the meaning of the chip. */
  readonly description?: string;
  /** A dashed border marks something set aside, such as an ignored term. */
  readonly dashed?: boolean;
}

export function Chip({ label, color, description, dashed = false }: ChipProps): JSX.Element {
  return (
    <span
      className={`text-text inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        dashed ? "border-dashed line-through decoration-1" : "border-solid"
      }`}
      style={{ borderColor: color }}
    >
      <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
      {description === undefined ? null : <span className="sr-only">{description}</span>}
    </span>
  );
}
