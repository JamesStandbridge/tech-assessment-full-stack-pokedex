import type { JSX } from "react";

export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

/** Every glyph is drawn on a square of this side, in user units. */
export const TYPE_GLYPH_VIEWBOX = 16;

/** Every path is stroked, never filled, with round caps and joins at this width. */
export const TYPE_GLYPH_STROKE = 1.25;

const DOT = 0.01;

function dot(x: number, y: number): string {
  return `M${String(x)} ${String(y)}h${String(DOT)}`;
}

/** SVG path data of the engraved glyph of each type, on a 16 by 16 square. */
export const TYPE_GLYPHS: Readonly<Record<PokemonType, readonly string[]>> = {
  normal: ["M3 8a5 5 0 1 0 10 0a5 5 0 1 0-10 0", dot(8, 8)],
  fire: [
    "M8 14.5c-2.8 0-4.5-1.9-4.5-4.3 0-2.6 2.2-3.9 2.7-6.7 1.4 1 2.1 2.4 2 3.8.9-.5 1.5-1.4 1.6-2.4 1.6 1.3 2.7 3.1 2.7 5.3 0 2.4-1.7 4.3-4.5 4.3z",
    "M8 14.5c-1.2 0-2-.8-2-1.9 0-1.2 1-1.8 2-3 1 1.2 2 1.8 2 3 0 1.1-.8 1.9-2 1.9z",
  ],
  water: ["M8 2c2.3 3 4 5.2 4 7.5a4 4 0 0 1-8 0C4 7.2 5.7 5 8 2z", "M6.1 10a2 2 0 0 0 1.7 1.9"],
  electric: ["M9.2 1.5 3.5 9h4.1l-1 5.5L12.5 7H8.4z"],
  grass: [
    "M2.5 13.5c0-6.3 4.2-11 11-11 0 6.8-4.7 11-11 11z",
    "M2.5 13.5 10 6",
    "M6 10h3M8.5 7.5V5",
  ],
  ice: [
    "M8 1.5v13M2.4 4.75l11.2 6.5M2.4 11.25l11.2-6.5",
    "M6.3 2.6 8 4l1.7-1.4M6.3 13.4 8 12l1.7 1.4",
  ],
  fighting: [
    "M8 1.5l1.3 3.4 3.4-1.2-1.6 3.3 3.4 1.5-3.6.7.4 3.6L8 10.5l-3.3 2.3.4-3.6-3.6-.7 3.4-1.5-1.6-3.3 3.4 1.2z",
  ],
  poison: [
    "M6 1.5h4M6.6 1.5v4L3.2 12.1a1.6 1.6 0 0 0 1.4 2.4h6.8a1.6 1.6 0 0 0 1.4-2.4L9.4 5.5v-4",
    "M4.6 10h6.8",
    dot(6.5, 12.3),
    dot(9.3, 11.9),
  ],
  ground: ["M1.5 13.5h13", "M3 10.5h10", "M5 7.5h6", "M7 4.5h2"],
  flying: [
    "M1.5 7.5c2.5-1.2 4.6-.8 6.5 1.8 1.9-2.6 4-3 6.5-1.8",
    "M4 11.5c1.5-.4 2.8.1 4 1.5 1.2-1.4 2.5-1.9 4-1.5",
  ],
  psychic: [
    "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z",
    "M6 8a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    dot(8, 8),
  ],
  bug: [
    "M8 5c2 0 3.2 1.7 3.2 4.3S10 14.5 8 14.5 4.8 11.9 4.8 9.3 6 5 8 5z",
    "M8 7v7.5M6.6 5.3 5 2.5M9.4 5.3 11 2.5",
    "M4.8 8.5H2.5M11.2 8.5h2.3M5 11.7l-2 1.3M11 11.7l2 1.3",
  ],
  rock: ["M4 13.5 2 8.5 5 3h6l3 5.5-2 5z", "M5 3 7 8.5 4 13.5M7 8.5h7M7 8.5l5 5"],
  ghost: [
    "M3.5 14.5V7.5a4.5 4.5 0 0 1 9 0v7l-1.5-1.3-1.5 1.3L8 13.2l-1.5 1.3L5 13.2z",
    dot(6.4, 7.6),
    dot(9.6, 7.6),
  ],
  dragon: [
    "M3.5 14c0-4.2 1.2-7.6 4.2-11",
    "M7.5 14.5c0-3.6.9-6.4 3.2-9",
    "M11.5 14c0-2 .5-3.9 2-5.6",
  ],
  dark: ["M11 2.2A6 6 0 1 0 13.8 11a4.9 4.9 0 0 1-2.8-8.8z", dot(11.8, 6.2)],
  steel: [
    "M8 1.5l5.6 3.25v6.5L8 14.5l-5.6-3.25v-6.5z",
    "M5.7 8a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0",
  ],
  fairy: ["M7 3Q7 9 13 9Q7 9 7 15Q7 9 1 9Q7 9 7 3z", "M12.5 1.5v4M10.5 3.5h4"],
};

export function isPokemonType(value: string): value is PokemonType {
  return POKEMON_TYPES.some((type) => type === value);
}

/** The glyph of a type, or the normal one for a type outside the eighteen. */
export function glyphPaths(type: string): readonly string[] {
  return isPokemonType(type) ? TYPE_GLYPHS[type] : TYPE_GLYPHS.normal;
}

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
