import type { CSSProperties, JSX } from "react";

import { TypeGlyph } from "./typeGlyphs";

interface TypeBadgeProps {
  readonly type: string;
  /** The glyph alone, for tight places; the name stays for assistive technologies. */
  readonly compact?: boolean;
}

function tinted(type: string): CSSProperties {
  const tint = `var(--color-tint-${type}, var(--color-muted))`;
  return {
    color: tint,
    borderColor: `color-mix(in oklab, ${tint} 50%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${tint} 12%, var(--color-panel))`,
  };
}

/** A type told apart by its tint and its engraved glyph as well as by its name. */
export function TypeBadge({ type, compact = false }: TypeBadgeProps): JSX.Element {
  if (compact) {
    return (
      <span
        title={type}
        data-type={type}
        className="rounded-control inline-grid size-6 place-items-center border"
        style={tinted(type)}
      >
        <TypeGlyph type={type} className="size-3.5" />
        <span className="sr-only">{type}</span>
      </span>
    );
  }
  return (
    <span
      data-type={type}
      className="rounded-control inline-flex items-center gap-1.5 border py-0.5 pr-2 pl-1.5 text-sm"
      style={tinted(type)}
    >
      <TypeGlyph type={type} className="size-3.5 shrink-0" />
      <span className="text-text capitalize">{type}</span>
    </span>
  );
}
