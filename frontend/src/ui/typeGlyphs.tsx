import type { JSX } from "react";

import { glyphPaths, TYPE_GLYPH_STROKE, TYPE_GLYPH_VIEWBOX } from "./typeGlyphPaths";

/** The engraved glyph of a type, in the current colour; decorative, so its name must be written beside it. */
export function TypeGlyph(props: {
  readonly type: string;
  readonly className: string;
}): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${String(TYPE_GLYPH_VIEWBOX)} ${String(TYPE_GLYPH_VIEWBOX)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={TYPE_GLYPH_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      {glyphPaths(props.type).map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
