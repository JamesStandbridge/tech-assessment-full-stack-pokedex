import { color, uniform, vec4 } from "three/tsl";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  LineBasicNodeMaterial,
  LineSegments,
} from "three/webgpu";

import type { Point } from "../../../domain/geometry";
import type { SceneFrame } from "../../../domain/scene";

const RING_SEGMENTS = 120;
const TICKS = 6;
const TICK_HEIGHT = 0.35;
const FADE_RATE = 2;
const GUIDE_COLOR = "#9aa6c4";

const opacity = uniform(0);

function ringSegments(radius: number): Point[] {
  return Array.from({ length: RING_SEGMENTS * 2 }, (_, vertex) => {
    const angle = ((Math.floor(vertex / 2) + (vertex % 2)) / RING_SEGMENTS) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: 0 };
  });
}

function axisSegments(from: Point, to: Point): Point[] {
  const ticks = Array.from({ length: TICKS }, (_, index) => {
    const share = index / (TICKS - 1);
    const x = from.x + (to.x - from.x) * share;
    return [
      { x, y: from.y - TICK_HEIGHT, z: from.z },
      { x, y: from.y + TICK_HEIGHT, z: from.z },
    ];
  });
  return [from, to, ...ticks.flat()];
}

/** The faint scaffolding of a reading: the stat axis of criteria, the rings of a weather. */
export class Guides {
  readonly object: LineSegments;
  private stagedAt = 0;

  constructor() {
    const material = new LineBasicNodeMaterial();
    material.colorNode = vec4(color(GUIDE_COLOR).mul(opacity), opacity.mul(0.5));
    material.transparent = true;
    material.depthWrite = false;
    material.blending = AdditiveBlending;
    this.object = new LineSegments(new BufferGeometry(), material);
    this.object.frustumCulled = false;
  }

  stage(frame: SceneFrame, time: number): void {
    const points = [
      ...(frame.axis === null ? [] : axisSegments(frame.axis.from, frame.axis.to)),
      ...frame.rings.flatMap((ring) => ringSegments(ring.radius)),
    ];
    const positions = new Float32Array(points.flatMap((point) => [point.x, point.y, point.z]));
    this.object.geometry.dispose();
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.object.geometry = geometry;
    this.stagedAt = time;
  }

  update(time: number): void {
    opacity.value = 1 - Math.exp(-FADE_RATE * Math.max(0, time - this.stagedAt));
  }
}
