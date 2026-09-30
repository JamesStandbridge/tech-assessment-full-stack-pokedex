import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { TypeBadge } from "./TypeBadge";
import {
  glyphPaths,
  isPokemonType,
  POKEMON_TYPES,
  type PokemonType,
  TYPE_GLYPH_STROKE,
  TYPE_GLYPH_VIEWBOX,
  TYPE_GLYPHS,
  TypeGlyph,
} from "./typeGlyphs";

test("each of the eighteen types has a glyph of its own", () => {
  const drawings = POKEMON_TYPES.map((type: PokemonType) => TYPE_GLYPHS[type].join(" "));
  expect(POKEMON_TYPES).toHaveLength(18);
  expect(new Set(drawings).size).toBe(POKEMON_TYPES.length);
  expect(drawings.every((drawing) => drawing.startsWith("M"))).toBe(true);
});

test("a type outside the eighteen is drawn with the normal glyph", () => {
  expect(isPokemonType("grass")).toBe(true);
  expect(isPokemonType("shadow")).toBe(false);
  expect(glyphPaths("shadow")).toBe(TYPE_GLYPHS.normal);
  expect(glyphPaths("fire")).toBe(TYPE_GLYPHS.fire);
});

test("a glyph is a decorative stroked drawing on its square", () => {
  const { container } = render(<TypeGlyph type="water" className="size-4" />);
  const svg = container.querySelector("svg");
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute(
    "viewBox",
    `0 0 ${String(TYPE_GLYPH_VIEWBOX)} ${String(TYPE_GLYPH_VIEWBOX)}`,
  );
  expect(svg).toHaveAttribute("stroke-width", String(TYPE_GLYPH_STROKE));
  expect(container.querySelectorAll("path")).toHaveLength(TYPE_GLYPHS.water.length);
});

test("a badge keeps the name of its type, even when compact", () => {
  render(
    <>
      <TypeBadge type="grass" />
      <TypeBadge type="poison" compact />
    </>,
  );
  expect(screen.getByText("grass")).toBeVisible();
  expect(screen.getByText("poison")).toHaveClass("sr-only");
});
