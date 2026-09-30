import {
  type CanvasTexture,
  Color,
  InstancedBufferAttribute,
  Sprite,
  type Texture,
} from "three/webgpu";

import type { Point } from "../../../domain/geometry";
import type { SceneFrame } from "../../../domain/scene";
import type { SceneNode } from "../../../domain/sceneTypes";
import { restingSpring, retarget, type Spring, springAt } from "../../../domain/spring";
import { HIDDEN, type Look, lookOf } from "../looks";
import { emblemHex } from "../palette";
import type { StarSeed } from "../protocol";
import { emblemAtlas, engrave } from "./atlas";
import {
  EMBLEM_CELL,
  EMBLEM_CELLS,
  LOOK_RATE,
  type StarBuffers,
  starMaterial,
} from "./starMaterial";

const RANK_DELAY = 0.02;
const MAX_DELAY = 0.6;
const DUST_DELAY = 0.4;

interface Fade {
  readonly from: Look;
  readonly to: Look;
  readonly start: number;
}

function buffer(count: number, size: number): InstancedBufferAttribute {
  return new InstancedBufferAttribute(new Float32Array(count * size), size);
}

function lookAt(fade: Fade, time: number): Look {
  const eased = 1 - Math.exp(-LOOK_RATE * Math.max(0, time - fade.start));
  const blend = (from: number, to: number): number => from + (to - from) * eased;
  return {
    size: blend(fade.from.size, fade.to.size),
    sprite: blend(fade.from.sprite, fade.to.sprite),
    glow: blend(fade.from.glow, fade.to.glow),
  };
}

/** A stable pseudo-random delay per slot, so the dust does not fall back all at once. */
function jitter(slot: number): number {
  const value = Math.sin(slot * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function delayOf(node: SceneNode, slot: number): number {
  if (node.emphasis === "dim" || node.emphasis === "idle") return jitter(slot) * DUST_DELAY;
  return Math.min(MAX_DELAY, (node.rank ?? 0) * RANK_DELAY);
}

export class Stars {
  readonly object: Sprite;
  readonly capacity: number;
  private readonly buffers: StarBuffers;
  private readonly springs: Spring[];
  private readonly fades: Fade[];
  private readonly nodes: (SceneNode | null)[];
  private readonly slots = new Map<string, number>();
  private highlighted: ReadonlySet<string> = new Set();

  private readonly emblems: CanvasTexture<OffscreenCanvas> = emblemAtlas();

  constructor(seeds: readonly StarSeed[], atlas: Texture) {
    this.capacity = seeds.length + EMBLEM_CELLS;
    this.buffers = {
      from: buffer(this.capacity, 4),
      velocity: buffer(this.capacity, 3),
      to: buffer(this.capacity, 3),
      lookFrom: buffer(this.capacity, 4),
      lookTo: buffer(this.capacity, 4),
      color: buffer(this.capacity, 4),
    };
    const origin = { x: 0, y: 0, z: 0 };
    this.springs = Array.from({ length: this.capacity }, () => restingSpring(origin));
    this.fades = Array.from({ length: this.capacity }, () => ({
      from: HIDDEN,
      to: HIDDEN,
      start: 0,
    }));
    this.nodes = Array.from({ length: this.capacity }, () => null);
    seeds.forEach((seed, slot) => {
      this.slots.set(`pokemon:${seed.name}`, slot);
      this.paint(slot, seed.color, slot);
    });
    for (let slot = seeds.length; slot < this.capacity; slot += 1) this.paint(slot, "#ffffff", -1);
    this.object = new Sprite(starMaterial(this.buffers, { sprites: atlas, emblems: this.emblems }));
    this.object.count = this.capacity;
    this.object.frustumCulled = false;
  }

  stage(frame: SceneFrame, time: number): void {
    const present = new Set(frame.nodes.map((node) => node.id));
    for (const [id, slot] of this.slots) {
      if (!present.has(id) && !id.startsWith("pokemon:")) this.release(id, slot, time);
    }
    for (const node of frame.nodes) {
      const slot = this.slots.get(node.id) ?? this.claim(node);
      if (slot === null) continue;
      this.nodes[slot] = node;
      this.springs[slot] = retarget(this.spring(slot), node.position, {
        time,
        delay: delayOf(node, slot),
      });
      this.writeSpring(slot);
      this.fadeTo(slot, lookOf(node, this.highlighted.has(node.id)), time);
    }
    this.flush();
  }

  highlight(ids: ReadonlySet<string>, time: number): void {
    const changed = new Set([...this.highlighted, ...ids]);
    this.highlighted = ids;
    for (const id of changed) {
      const slot = this.slots.get(id);
      const node = slot === undefined ? null : (this.nodes[slot] ?? null);
      if (slot !== undefined && node !== null) this.fadeTo(slot, lookOf(node, ids.has(id)), time);
    }
    this.flush();
  }

  nodeAt(slot: number): SceneNode | null {
    return this.nodes[slot] ?? null;
  }

  slotOf(id: string): number | undefined {
    return this.slots.get(id);
  }

  positionAt(slot: number, time: number): Point {
    return springAt(this.spring(slot), time).position;
  }

  sizeAt(slot: number, time: number): number {
    const fade = this.fades[slot];
    return fade === undefined ? 0 : lookAt(fade, time).size;
  }

  private spring(slot: number): Spring {
    return this.springs[slot] ?? restingSpring({ x: 0, y: 0, z: 0 });
  }

  private claim(node: SceneNode): number | null {
    if (node.kind === "pokemon") return null;
    const used = new Set(this.slots.values());
    const first = this.capacity - EMBLEM_CELLS;
    const slot = Array.from({ length: EMBLEM_CELLS }, (_, index) => first + index).find(
      (candidate) => !used.has(candidate),
    );
    if (slot === undefined) return null;
    this.slots.set(node.id, slot);
    this.springs[slot] = restingSpring(node.position);
    this.fades[slot] = { from: HIDDEN, to: HIDDEN, start: 0 };
    if (node.emblem !== null) engrave(this.emblems, slot - first, node.emblem);
    this.paint(slot, emblemHex(node), node.emblem === null ? -1 : EMBLEM_CELL + slot - first);
    return slot;
  }

  private release(id: string, slot: number, time: number): void {
    this.slots.delete(id);
    this.nodes[slot] = null;
    this.fadeTo(slot, HIDDEN, time);
  }

  private fadeTo(slot: number, look: Look, time: number): void {
    const fade = this.fades[slot];
    const from = fade === undefined ? HIDDEN : lookAt(fade, time);
    this.fades[slot] = { from, to: look, start: time };
    this.buffers.lookFrom.setXYZW(slot, from.size, from.sprite, from.glow, time);
    this.buffers.lookTo.setXYZW(slot, look.size, look.sprite, look.glow, 0);
  }

  private writeSpring(slot: number): void {
    const spring = this.spring(slot);
    this.buffers.from.setXYZW(slot, spring.from.x, spring.from.y, spring.from.z, spring.start);
    this.buffers.velocity.setXYZ(slot, spring.velocity.x, spring.velocity.y, spring.velocity.z);
    this.buffers.to.setXYZ(slot, spring.to.x, spring.to.y, spring.to.z);
  }

  private paint(slot: number, hex: string, tile: number): void {
    const color = new Color(hex);
    this.buffers.color.setXYZW(slot, color.r, color.g, color.b, tile);
    this.buffers.color.needsUpdate = true;
  }

  private flush(): void {
    const { from, velocity, to, lookFrom, lookTo, color } = this.buffers;
    for (const attribute of [from, velocity, to, lookFrom, lookTo, color]) {
      attribute.needsUpdate = true;
    }
  }
}
