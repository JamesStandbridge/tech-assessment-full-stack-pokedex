import { MathUtils, type PerspectiveCamera, Vector3 } from "three/webgpu";

import type { Point } from "../../../domain/geometry";
import type { Viewport } from "../protocol";
import type { Stars } from "./stars";

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
  /** Radius of a star of the given size, in CSS pixels. */
  readonly radius: number;
  readonly visible: boolean;
}

const MIN_PICK_RADIUS = 10;
const scratch = new Vector3();

export function toScreen(
  camera: PerspectiveCamera,
  viewport: Viewport,
  world: { readonly point: Point; readonly size: number },
): ScreenPoint {
  scratch.set(world.point.x, world.point.y, world.point.z).applyMatrix4(camera.matrixWorldInverse);
  const depth = -scratch.z;
  scratch.set(world.point.x, world.point.y, world.point.z).project(camera);
  const focal = viewport.height / 2 / Math.tan(MathUtils.degToRad(camera.fov) / 2);
  return {
    x: ((scratch.x + 1) / 2) * viewport.width,
    y: ((1 - scratch.y) / 2) * viewport.height,
    radius: depth > 0 ? ((world.size / 2) * focal) / depth : 0,
    visible: depth > 0 && Math.abs(scratch.x) <= 1.05 && Math.abs(scratch.y) <= 1.05,
  };
}

export interface Probe {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

/** Return the star under a pointer: the closest to it, relative to its size, among the visible ones. */
export function pickStar(
  stars: Stars,
  lens: { readonly camera: PerspectiveCamera; readonly viewport: Viewport },
  probe: Probe,
): string | null {
  let best: { readonly id: string; readonly score: number } | null = null;
  for (let slot = 0; slot < stars.capacity; slot += 1) {
    const node = stars.nodeAt(slot);
    if (node === null || node.emphasis === "dim") continue;
    const size = stars.sizeAt(slot, probe.time);
    const screen = toScreen(lens.camera, lens.viewport, {
      point: stars.positionAt(slot, probe.time),
      size,
    });
    const reach = Math.max(MIN_PICK_RADIUS, screen.radius * 0.7);
    const score = Math.hypot(screen.x - probe.x, screen.y - probe.y) / reach;
    if (screen.visible && score <= 1 && (best === null || score < best.score)) {
      best = { id: node.id, score };
    }
  }
  return best?.id ?? null;
}
