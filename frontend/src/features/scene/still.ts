import type { Point } from "../../domain/geometry";
import { namedNodes, type SceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { lookOf } from "./looks";
import type { Inset, Mark, Viewport } from "./protocol";

/** Height the scene camera sees at a distance of one, with its vertical field of 46 degrees. */
const FIELD = 2 * Math.tan((23 * Math.PI) / 180);
const DEPTH_CUE = 0.02;

export interface Space {
  readonly viewport: Viewport;
  readonly inset: Inset;
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
    height: viewport.height - inset.bottom,
  };
  const scale = Math.min(free.width, free.height) / (frame.camera.distance * FIELD);
  const target = frame.camera.target;
  const cue = (depth: number): number => Math.max(0.4, 1 + (depth - target.z) * DEPTH_CUE);
  return {
    project: (at) => ({
      x: inset.left + free.width / 2 + (at.x - target.x) * scale * cue(at.z),
      y: free.height / 2 - (at.y - target.y) * scale * cue(at.z),
    }),
    radius: (size, depth) => (size / 2) * scale * cue(depth),
  };
}

/** The label positions of the still map, in the order the engine reports them. */
export function stillPositions(
  frame: SceneFrame,
  marks: readonly Mark[],
  space: Space,
): Float32Array {
  const view = stillView(frame, space);
  const place = (at: Point, size: number): readonly number[] => {
    const screen = view.project(at);
    return [screen.x, screen.y, view.radius(size, at.z), 1];
  };
  const named = namedNodes(frame).map((node: SceneNode) =>
    place(node.position, lookOf(node, false).size),
  );
  const fixed = marks.map((mark) => place(mark.position, 1));
  return Float32Array.from([...named, ...fixed].flat());
}
