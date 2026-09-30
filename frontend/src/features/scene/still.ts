import type { Point } from "../../domain/geometry";
import { namedNodes, type SceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { lookOf } from "./looks";
import type { Inset, Mark, Viewport } from "./protocol";

/** Height the scene camera sees at a distance of one, with its vertical field of 46 degrees. */
const FIELD = 2 * Math.tan((23 * Math.PI) / 180);
const DEPTH_CUE = 0.02;
const MIN_SCALE = 0.4;
const MAX_SCALE = 6;
const MIN_PICK_RADIUS = 10;
const PICK_SHARE = 0.7;

export interface Space {
  readonly viewport: Viewport;
  readonly inset: Inset;
}

/** How the user moved the map: a shift in pixels, then a scale around the top left corner. */
export interface Pan {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export const UNMOVED: Pan = { x: 0, y: 0, scale: 1 };

/** What the still map shows: its space, how the user moved it, and the star under the pointer. */
export interface Sight extends Space {
  readonly pan: Pan;
  readonly hovered: string | null;
}

export interface StillView {
  readonly project: (point: Point) => { readonly x: number; readonly y: number };
  /** Screen radius of a star of a given size at a given depth. */
  readonly radius: (size: number, depth: number) => number;
}

/**
 * A front view of the frame as the scene camera sees it once settled: centered
 * in the part of the viewport the results leave free, and fitted to it.
 */
export function stillView(frame: SceneFrame, space: Space): StillView {
  const { viewport, inset } = space;
  const free = {
    width: viewport.width - inset.left - inset.right,
    height: viewport.height - inset.top - inset.bottom,
  };
  const scale = Math.min(free.width, free.height) / (frame.camera.distance * FIELD);
  const target = frame.camera.target;
  const cue = (depth: number): number => Math.max(0.4, 1 + (depth - target.z) * DEPTH_CUE);
  return {
    project: (at) => ({
      x: inset.left + free.width / 2 + (at.x - target.x) * scale * cue(at.z),
      y: inset.top + free.height / 2 - (at.y - target.y) * scale * cue(at.z),
    }),
    radius: (size, depth) => (size / 2) * scale * cue(depth),
  };
}

/** The view once the user moved it. */
export function panned(view: StillView, pan: Pan): StillView {
  return {
    project: (at) => {
      const screen = view.project(at);
      return { x: screen.x * pan.scale + pan.x, y: screen.y * pan.scale + pan.y };
    },
    radius: (size, depth) => view.radius(size, depth) * pan.scale,
  };
}

export function panBy(pan: Pan, shift: { readonly dx: number; readonly dy: number }): Pan {
  return { ...pan, x: pan.x + shift.dx, y: pan.y + shift.dy };
}

/** Scale the map by the inverse of a factor, keeping the point under the pointer in place. */
export function zoomAt(
  pan: Pan,
  zoom: { readonly factor: number; readonly x: number; readonly y: number },
): Pan {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pan.scale / zoom.factor));
  const ratio = scale / pan.scale;
  return { x: zoom.x - (zoom.x - pan.x) * ratio, y: zoom.y - (zoom.y - pan.y) * ratio, scale };
}

/** The label positions of the still map, in the order the engine reports them. */
export function stillPositions(
  frame: SceneFrame,
  marks: readonly Mark[],
  sight: Sight,
): Float32Array {
  const view = panned(stillView(frame, sight), sight.pan);
  const place = (at: Point, size: number): readonly number[] => {
    const screen = view.project(at);
    return [screen.x, screen.y, view.radius(size, at.z), 1];
  };
  const named = namedNodes(frame).map((node: SceneNode) =>
    place(node.position, lookOf(node, false).size),
  );
  const fixed = marks.map((mark) => place(mark.position, 1));
  const hovered = frame.nodes.find((node) => node.id === sight.hovered);
  const pointed =
    hovered === undefined ? [] : [place(hovered.position, lookOf(hovered, false).size)];
  return Float32Array.from([...named, ...fixed, ...pointed].flat());
}

/** Return the star under a pointer: the closest to it, relative to its size, as the scene picks. */
export function stillPick(
  frame: SceneFrame,
  view: StillView,
  probe: { readonly x: number; readonly y: number; readonly highlighted: ReadonlySet<string> },
): string | null {
  let best: { readonly id: string; readonly score: number } | null = null;
  for (const node of frame.nodes) {
    if (node.emphasis === "dim") continue;
    const at = view.project(node.position);
    const radius = view.radius(lookOf(node, probe.highlighted.has(node.id)).size, node.position.z);
    const reach = Math.max(MIN_PICK_RADIUS, radius * PICK_SHARE);
    const score = Math.hypot(at.x - probe.x, at.y - probe.y) / reach;
    if (score <= 1 && (best === null || score < best.score)) best = { id: node.id, score };
  }
  return best?.id ?? null;
}
