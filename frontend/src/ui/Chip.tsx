import type { JSX } from "react";

interface ChipProps {
  readonly label: string;
  /** CSS colour of the pigment swatch, such as var(--color-type-fire). */
  readonly color: string;
  /** Extra words for assistive technologies, such as the meaning of the tag. */
  readonly description?: string;
  /** Struck through, for something set aside such as an ignored term. */
  readonly dashed?: boolean;
}

/** A small-caps label with a swatch of pigment, as on the key of a plate. */
export function Chip({ label, color, description, dashed = false }: ChipProps): JSX.Element {
  return (
    <span
      className={`label text-ink inline-flex items-center gap-1.5 ${
        dashed ? "text-ink-soft line-through decoration-1" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-3.5 rounded-[1px]"
        style={{ backgroundColor: color }}
      />
      {label}
      {description === undefined ? null : <span className="sr-only">{description}</span>}
    </span>
  );
}
