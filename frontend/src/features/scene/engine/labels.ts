import type { PerspectiveCamera } from "three/webgpu";

import type { Point } from "../../../domain/geometry";
import { namedNodes, type SceneFrame } from "../../../domain/scene";
import { LABEL_STRIDE, type Mark, type Viewport } from "../protocol";
import { toScreen } from "./lens";
import type { Stars } from "./stars";

const TOLERANCE = 0.25;
const MARK_SIZE = 1;

function changed(previous: Float32Array, next: Float32Array): boolean {
  if (previous.length !== next.length) return true;
  return next.some((value, index) => Math.abs(value - (previous[index] ?? 0)) > TOLERANCE);
}

/**
 * Follows the points the page labels: the named nodes of the frame, its marks,
 * then the hovered star, in the order of LABEL_STRIDE.
 */
export class LabelTracker {
  private named: readonly string[] = [];
  private marks: readonly Mark[] = [];
  private previous = new Float32Array(0);

  track(frame: SceneFrame, marks: readonly Mark[]): void {
    this.named = namedNodes(frame).map((node) => node.id);
    this.marks = marks;
  }

  /** Return the positions when they moved since the last call, or null. */
  measure(
    stars: Stars,
    lens: { readonly camera: PerspectiveCamera; readonly viewport: Viewport },
    moment: { readonly time: number; readonly hovered: string | null },
  ): Float32Array | null {
    const star = (id: string): { readonly point: Point; readonly size: number } | null => {
      const slot = stars.slotOf(id);
      return slot === undefined
        ? null
        : { point: stars.positionAt(slot, moment.time), size: stars.sizeAt(slot, moment.time) };
    };
    const points = [
      ...this.named.map(star),
      ...this.marks.map((mark) => ({ point: mark.position, size: MARK_SIZE })),
      ...(moment.hovered === null ? [] : [star(moment.hovered)]),
    ];
    const next = new Float32Array(points.length * LABEL_STRIDE);
    points.forEach((world, index) => {
      if (world === null) return;
      const screen = toScreen(lens.camera, lens.viewport, world);
      next.set([screen.x, screen.y, screen.radius, screen.visible ? 1 : 0], index * LABEL_STRIDE);
    });
    if (!changed(this.previous, next)) return null;
    this.previous = next;
    return next.slice();
  }
}
