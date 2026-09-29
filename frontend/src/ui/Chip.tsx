import type { JSX } from "react";

interface ChipProps {
  readonly label: string;
  /** CSS colour of the border and the label, such as var(--color-tone-stat). */
  readonly color: string;
  /** Extra words for assistive technologies, such as the meaning of the chip. */
  readonly description?: string;
  /** A dashed border marks something set aside, such as an ignored term. */
  readonly dashed?: boolean;
}

export function Chip({ label, color, description, dashed = false }: ChipProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
        dashed ? "border-dashed line-through decoration-1" : "border-solid"
      }`}
      style={{ borderColor: color, color }}
    >
      {label}
      {description === undefined ? null : <span className="sr-only">{description}</span>}
    </span>
  );
}
