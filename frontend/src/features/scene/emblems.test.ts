import { describe, expect, it } from "vitest";

import type { Emblem, SceneNode } from "../../domain/sceneTypes";
import { glyphPaths } from "../../ui/typeGlyphPaths";
import { EMBLEM_SIZE, emblemStrokes } from "./emblems";
import { lookOf } from "./looks";
import { emblemHex, kindHex, typeHex, weatherHex } from "./palette";

function node(emblem: Emblem | null, emphasis: SceneNode["emphasis"]): SceneNode {
  const kind = emblem === null ? "pokemon" : emblem.kind;
  return {
    id: `${kind}:x`,
    label: "X",
    kind,
    ref: { kind: kind === "weather" ? "move" : kind, name: "x" },
    position: { x: 0, y: 0, z: 0 },
    emphasis,
    rank: null,
    ring: null,
    emblem,
  };
}

const THUNDERBOLT: Emblem = { kind: "move", type: "electric", damageClass: "special" };

describe("emblemStrokes", () => {
  it("rings a move around its type glyph, with its damage class on the rim", () => {
    const strokes = emblemStrokes(THUNDERBOLT);
    const glyph = glyphPaths("electric");
    expect(strokes).toHaveLength(glyph.length + 2);
    expect(strokes.slice(1, -1).map((stroke) => stroke.d)).toEqual(glyph);
    const mark = strokes.at(-1);
    expect(mark?.scale).toBeLessThan(0.5);
    expect(mark?.x).toBeGreaterThan(EMBLEM_SIZE / 2);
  });

  it("marks each damage class differently", () => {
    const marks = (["physical", "special", "status"] as const).map(
      (damageClass) => emblemStrokes({ ...THUNDERBOLT, damageClass }).at(-1)?.d,
    );
    expect(new Set(marks).size).toBe(3);
  });

  it("frames an ability in a hexagon and a weather in a double ring", () => {
    expect(emblemStrokes({ kind: "ability" })[0]?.d).toMatch(/^M8\.00 0\.50L/);
    const rain = emblemStrokes({ kind: "weather", weather: "rain" });
    const hail = emblemStrokes({ kind: "weather", weather: "hail" });
    expect(rain.filter((stroke) => stroke.scale === 1)).toHaveLength(2);
    expect(rain.slice(2)).not.toEqual(hail.slice(2));
  });

  it("falls back on the sun for a weather it has no symbol for", () => {
    expect(emblemStrokes({ kind: "weather", weather: "fog" })).toEqual(
      emblemStrokes({ kind: "weather", weather: "sun" }),
    );
  });

  it("keeps every line inside its square", () => {
    for (const stroke of emblemStrokes(THUNDERBOLT)) {
      expect(stroke.x).toBeGreaterThanOrEqual(0);
      expect(stroke.x + EMBLEM_SIZE * stroke.scale).toBeLessThanOrEqual(EMBLEM_SIZE + 1);
    }
  });
});

describe("emblem looks", () => {
  it("shows the engraving and caps its size, even in front and pointed at", () => {
    const front = lookOf(node(THUNDERBOLT, "front"), true);
    expect(front.sprite).toBe(1);
    expect(front.size).toBeLessThanOrEqual(2.1);
    expect(front.size).toBeLessThan(lookOf(node(null, "front"), false).size);
    expect(lookOf(node(THUNDERBOLT, "idle"), false).glow).toBeLessThan(0.5);
  });

  it("leaves an unlit emblem as dust", () => {
    expect(lookOf(node({ kind: "ability" }, "dim"), false).sprite).toBe(0);
  });
});

describe("emblemHex", () => {
  it("inks a move in its type, an ability in its kind and a weather in its own colour", () => {
    expect(emblemHex(node(THUNDERBOLT, "lit"))).toBe(typeHex("electric"));
    expect(emblemHex(node({ kind: "ability" }, "lit"))).toBe(kindHex("ability"));
    expect(emblemHex(node({ kind: "weather", weather: "sun" }, "lit"))).toBe(weatherHex("sun"));
    expect(emblemHex(node(null, "lit"))).toBe(kindHex("pokemon"));
  });
});
