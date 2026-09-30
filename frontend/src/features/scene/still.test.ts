import { describe, expect, test } from "vitest";

import { constellation } from "../../domain/constellation";
import { namedNodes, type SceneFrame, sceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { rainTeamSearch } from "../../test/recorded/rainTeamSearch";
import { speciesList } from "../../test/recorded/speciesList";
import { LABEL_STRIDE, NO_INSET } from "./protocol";
import { panBy, panned, stillPick, stillPositions, stillView, UNMOVED, zoomAt } from "./still";

const frame: SceneFrame = sceneFrame(constellation(speciesList.species), rainTeamSearch);
const space = { viewport: { width: 1200, height: 800, pixelRatio: 1 }, inset: NO_INSET };
const view = stillView(frame, space);
const none: ReadonlySet<string> = new Set();

function node(id: string): SceneNode {
  const found = frame.nodes.find((one) => one.id === id);
  if (found === undefined) throw new Error(`no node ${id}`);
  return found;
}

describe("the moves of the still map", () => {
  test("a pan shifts the view by the drag", () => {
    expect(panBy(UNMOVED, { dx: 30, dy: -10 })).toEqual({ x: 30, y: -10, scale: 1 });
  });

  test("a zoom keeps the point under the pointer in place", () => {
    const pan = zoomAt(panBy(UNMOVED, { dx: 40, dy: 20 }), { factor: 0.5, x: 300, y: 200 });
    expect(pan.scale).toBe(2);
    const moved = panned(view, pan);
    const star = node("ability:swift-swim").position;
    const before = panned(view, panBy(UNMOVED, { dx: 40, dy: 20 })).project(star);
    const after = moved.project(star);
    expect(after.x - 300).toBeCloseTo((before.x - 300) * 2);
    expect(after.y - 200).toBeCloseTo((before.y - 200) * 2);
  });

  test("the zoom stays within its bounds", () => {
    expect(zoomAt(UNMOVED, { factor: 1e-3, x: 0, y: 0 }).scale).toBe(6);
    expect(zoomAt(UNMOVED, { factor: 1e3, x: 0, y: 0 }).scale).toBe(0.4);
  });

  test("a moved view scales the radii of the stars", () => {
    const pan = { x: 5, y: 5, scale: 3 };
    expect(panned(view, pan).radius(2, 0)).toBeCloseTo(view.radius(2, 0) * 3);
  });
});

describe("stillPositions", () => {
  test("labels follow the moved view, and the hovered star comes last", () => {
    const pan = { x: 100, y: -50, scale: 1 };
    const named = namedNodes(frame).length;
    const still = stillPositions(frame, [], { ...space, pan: UNMOVED, hovered: null });
    const moved = stillPositions(frame, [], { ...space, pan, hovered: "weather:rain" });
    expect(still).toHaveLength(named * LABEL_STRIDE);
    expect(moved).toHaveLength((named + 1) * LABEL_STRIDE);
    expect(moved[0]).toBeCloseTo((still[0] ?? 0) + 100);
    expect(moved[1]).toBeCloseTo((still[1] ?? 0) - 50);
    const rain = view.project(node("weather:rain").position);
    expect(moved[named * LABEL_STRIDE]).toBeCloseTo(rain.x + 100);
  });
});

describe("stillPick", () => {
  test("finds the star under the pointer, wherever the view moved", () => {
    const pan = { x: -80, y: 30, scale: 1.5 };
    const moved = panned(view, pan);
    const at = moved.project(node("ability:swift-swim").position);
    expect(stillPick(frame, moved, { ...at, highlighted: none })).toBe("ability:swift-swim");
  });

  test("finds nothing in empty sky, and never a dimmed star", () => {
    expect(stillPick(frame, view, { x: -500, y: -500, highlighted: none })).toBeNull();
    const dim = frame.nodes.find((one) => one.emphasis === "dim");
    if (dim === undefined) throw new Error("no dimmed star");
    const at = view.project(dim.position);
    expect(stillPick(frame, view, { ...at, highlighted: none })).not.toBe(dim.id);
  });
});
