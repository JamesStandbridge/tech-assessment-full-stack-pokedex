import { assertNever } from "../../domain/assertNever";
import type { Emblem } from "../../domain/sceneTypes";
import { glyphPaths, TYPE_GLYPH_STROKE, TYPE_GLYPH_VIEWBOX } from "../../ui/typeGlyphPaths";

/** One engraved line of an emblem: path data, placed by a scale then a shift in the emblem square. */
export interface EmblemStroke {
  readonly d: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** Width of the line in the units of its path. */
  readonly width: number;
}

/** Every emblem is drawn on a square of this side, as the type glyphs are. */
export const EMBLEM_SIZE = TYPE_GLYPH_VIEWBOX;

const CENTER = EMBLEM_SIZE / 2;
const OUTLINE_WIDTH = 0.6;
const FRAME_RADIUS = 7.2;
const INNER_RADIUS = 6.2;
const GLYPH_SCALE = 0.56;
const MARK_SCALE = 0.26;
/** Where the damage class sits: on the frame, down and to the right. */
const MARK_AT = CENTER + FRAME_RADIUS * Math.SQRT1_2;
const DOT = 0.01;

function circle(radius: number): string {
  const r = String(radius);
  return `M${String(CENTER - radius)} ${String(CENTER)}a${r} ${r} 0 1 0 ${String(2 * radius)} 0a${r} ${r} 0 1 0 ${String(-2 * radius)} 0`;
}

function hexagon(radius: number): string {
  const corners = Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;
    const x = CENTER + radius * Math.cos(angle);
    const y = CENTER + radius * Math.sin(angle);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M${corners.join("L")}Z`;
}

function dot(x: number, y: number): string {
  return `M${String(x)} ${String(y)}h${String(DOT)}`;
}

const CLOUD = "M4.5 9.5a2.5 2.5 0 0 1 .4-5 3.5 3.5 0 0 1 6.6.8 2.1 2.1 0 0 1 .1 4.2z";
const WAVE = "c2-1.3 4-1.3 6 0s4 1.3 6 0";

const WEATHER_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  sun: [
    "M5 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
    "M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4",
  ],
  rain: [CLOUD, "M5.5 11.5l-.8 2M8.3 11.5l-.8 2M11.1 11.5l-.8 2"],
  sandstorm: [`M2 5.5${WAVE}`, `M2 8.5${WAVE}`, `M2 11.5${WAVE}`],
  hail: [CLOUD, dot(5.5, 12.5), dot(8.3, 13.3), dot(11.1, 12.5)],
};

/** A four-pointed sparkle: what the Pokémon brings with it, rather than what it does. */
const ABILITY_GLYPH = ["M8 3.5 9.1 6.9 12.5 8 9.1 9.1 8 12.5 6.9 9.1 3.5 8 6.9 6.9Z"];

const DAMAGE_MARKS: Readonly<Record<Extract<Emblem, { kind: "move" }>["damageClass"], string>> = {
  physical: "M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4Z",
  special: `${circle(6)}${circle(2.5)}`,
  status: `${circle(6)}M2 8h12`,
};

function frame(d: string): EmblemStroke {
  return { d, x: 0, y: 0, scale: 1, width: OUTLINE_WIDTH };
}

function glyph(paths: readonly string[]): readonly EmblemStroke[] {
  const offset = CENTER * (1 - GLYPH_SCALE);
  const width = TYPE_GLYPH_STROKE;
  return paths.map((d) => ({ d, x: offset, y: offset, scale: GLYPH_SCALE, width }));
}

function mark(d: string): EmblemStroke {
  const offset = MARK_AT - CENTER * MARK_SCALE;
  return { d, x: offset, y: offset, scale: MARK_SCALE, width: OUTLINE_WIDTH / MARK_SCALE };
}

/**
 * The engraved lines of an emblem: a move is a medallion with its type glyph and
 * its damage class on the rim, an ability a hexagon with a sparkle, and a weather
 * its symbol inside a double ring, as the rings it draws around itself.
 */
export function emblemStrokes(emblem: Emblem): readonly EmblemStroke[] {
  switch (emblem.kind) {
    case "move":
      return [
        frame(circle(FRAME_RADIUS)),
        ...glyph(glyphPaths(emblem.type)),
        mark(DAMAGE_MARKS[emblem.damageClass]),
      ];
    case "ability":
      return [frame(hexagon(FRAME_RADIUS + 0.3)), ...glyph(ABILITY_GLYPH)];
    case "weather":
      return [
        frame(circle(FRAME_RADIUS)),
        frame(circle(INNER_RADIUS)),
        ...glyph(WEATHER_GLYPHS[emblem.weather] ?? WEATHER_GLYPHS["sun"] ?? []),
      ];
    default:
      return assertNever(emblem);
  }
}
