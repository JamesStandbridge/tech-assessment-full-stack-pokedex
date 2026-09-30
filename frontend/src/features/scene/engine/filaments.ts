import { attribute, float, fract, pow, uniform, vec4 } from "three/tsl";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineBasicNodeMaterial,
  LineSegments,
} from "three/webgpu";

import type { Point } from "../../../domain/geometry";
import type { SceneFrame } from "../../../domain/scene";
import { kindHex, weatherHex } from "../palette";
import { glowOrPrint, printShade } from "./ink";

const MAX_LINKS = 320;
const SEGMENTS = 14;
const VERTICES = MAX_LINKS * SEGMENTS * 2;
const BOW = 0.18;
const PULSE_SPEED = 0.45;
const PULSE_SHARPNESS = 6;
const FADE_RATE = 2.5;

interface Strand {
  readonly source: string;
  readonly target: string;
}

const filamentUniforms = { time: uniform(0), opacity: uniform(0) };

function material(): LineBasicNodeMaterial {
  const progress = attribute<"float">("progress", "float");
  const strength = attribute<"float">("strength", "float");
  const tint = attribute<"vec3">("tint", "vec3");
  const pulse = pow(
    float(1).sub(fract(progress.sub(filamentUniforms.time.mul(PULSE_SPEED)))),
    PULSE_SHARPNESS,
  );
  const brightness = strength.mul(float(0.2).add(pulse.mul(0.9))).mul(filamentUniforms.opacity);
  const result = new LineBasicNodeMaterial();
  result.colorNode = vec4(tint.mul(printShade).mul(brightness), brightness);
  result.transparent = true;
  result.depthWrite = false;
  result.blending = AdditiveBlending;
  return glowOrPrint(result);
}

/** A point on the quadratic curve of a strand, bowed towards the camera. */
function along(from: Point, to: Point, step: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
  const control = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
    z: (from.z + to.z) / 2 + length * BOW,
  };
  const a = (1 - step) ** 2;
  const b = 2 * (1 - step) * step;
  const c = step ** 2;
  return {
    x: a * from.x + b * control.x + c * to.x,
    y: a * from.y + b * control.y + c * to.y,
    z: a * from.z + b * control.z + c * to.z,
  };
}

/** The relations of a reading, drawn as strands along which a pulse runs from source to target. */
export class Filaments {
  readonly object: LineSegments;
  private strands: readonly Strand[] = [];
  private stagedAt = 0;
  private readonly positions = new BufferAttribute(new Float32Array(VERTICES * 3), 3);
  private readonly progress = new BufferAttribute(new Float32Array(VERTICES), 1);
  private readonly strength = new BufferAttribute(new Float32Array(VERTICES), 1);
  private readonly tint = new BufferAttribute(new Float32Array(VERTICES * 3), 3);

  constructor() {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", this.positions);
    geometry.setAttribute("progress", this.progress);
    geometry.setAttribute("strength", this.strength);
    geometry.setAttribute("tint", this.tint);
    geometry.setDrawRange(0, 0);
    this.object = new LineSegments(geometry, material());
    this.object.frustumCulled = false;
  }

  stage(frame: SceneFrame, time: number): void {
    const links = frame.links.slice(0, MAX_LINKS);
    const kinds = new Map(frame.nodes.map((node) => [node.id, node.kind]));
    this.strands = links;
    this.stagedAt = time;
    links.forEach((link, index) => {
      const kind = kinds.get(link.source) ?? "pokemon";
      const hex =
        kind === "weather" && frame.weather !== null ? weatherHex(frame.weather) : kindHex(kind);
      const color = new Color(hex);
      for (let vertex = 0; vertex < SEGMENTS * 2; vertex += 1) {
        const offset = index * SEGMENTS * 2 + vertex;
        this.progress.setX(offset, (Math.floor(vertex / 2) + (vertex % 2)) / SEGMENTS);
        this.strength.setX(offset, link.strength);
        this.tint.setXYZ(offset, color.r, color.g, color.b);
      }
    });
    this.object.geometry.setDrawRange(0, links.length * SEGMENTS * 2);
    this.progress.needsUpdate = true;
    this.strength.needsUpdate = true;
    this.tint.needsUpdate = true;
  }

  update(time: number, positionOf: (id: string) => Point | null): void {
    filamentUniforms.time.value = time;
    filamentUniforms.opacity.value = 1 - Math.exp(-FADE_RATE * Math.max(0, time - this.stagedAt));
    this.strands.forEach((strand, index) => {
      const from = positionOf(strand.source);
      const to = positionOf(strand.target);
      if (from === null || to === null) return;
      for (let vertex = 0; vertex < SEGMENTS * 2; vertex += 1) {
        const point = along(from, to, (Math.floor(vertex / 2) + (vertex % 2)) / SEGMENTS);
        this.positions.setXYZ(index * SEGMENTS * 2 + vertex, point.x, point.y, point.z);
      }
    });
    this.positions.needsUpdate = true;
  }
}
