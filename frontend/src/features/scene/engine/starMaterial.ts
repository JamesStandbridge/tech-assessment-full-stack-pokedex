import {
  exp,
  float,
  floor,
  instancedBufferAttribute,
  length,
  max,
  min,
  mix,
  mod,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import {
  type InstancedBufferAttribute,
  type Node,
  SpriteNodeMaterial,
  type Texture,
} from "three/webgpu";

import { STIFFNESS } from "../../../domain/spring";
import { printShade } from "./ink";

/** Per-star data, one row per instance. */
export interface StarBuffers {
  /** Where the spring starts, and when, in w. */
  readonly from: InstancedBufferAttribute;
  readonly velocity: InstancedBufferAttribute;
  readonly to: InstancedBufferAttribute;
  /** The look the star leaves (size, sprite, glow), and since when, in w. */
  readonly lookFrom: InstancedBufferAttribute;
  readonly lookTo: InstancedBufferAttribute;
  /** The glow color, and the atlas tile in w, negative without sprite. */
  readonly color: InstancedBufferAttribute;
}

export interface StarTextures {
  readonly sprites: Texture;
  readonly emblems: Texture;
}

export const ATLAS_COLUMNS = 16;
export const ATLAS_ROWS = 10;
/** Tiles from this one on are cells of the emblem atlas, which has the same columns. */
export const EMBLEM_CELL = ATLAS_COLUMNS * ATLAS_ROWS;
export const EMBLEM_ROWS = 4;
/** Room for the moves, abilities and weathers a reading adds to the species, one cell each. */
export const EMBLEM_CELLS = ATLAS_COLUMNS * EMBLEM_ROWS;
/** How fast a star changes its look, per second. */
export const LOOK_RATE = 5;
/** Share of the quad the sprite covers; the rest is glow. */
const SPRITE_FILL = 0.62;
const GLOW_FALLOFF = -5;

export const starUniforms = {
  time: uniform(0),
  atlasReady: uniform(0),
};

function inside(value: Node<"vec2">): Node<"float"> {
  return step(0, value.x).mul(step(value.x, 1)).mul(step(0, value.y)).mul(step(value.y, 1));
}

/** Where a point of the quad falls in its tile of an atlas of so many rows. */
function tileUv(tile: Node<"float">, inner: Node<"vec2">, rows: number): Node<"vec2"> {
  const cell = vec2(mod(tile, ATLAS_COLUMNS), floor(tile.div(ATLAS_COLUMNS)));
  return vec2(
    cell.x.add(inner.x).div(ATLAS_COLUMNS),
    float(rows).sub(cell.y).sub(1).add(inner.y).div(rows),
  );
}

/** The sprite of a species, or the engraving of a move, ability or weather. */
function tileSample(
  textures: StarTextures,
  tile: Node<"float">,
  inner: Node<"vec2">,
): Node<"vec4"> {
  const sprite = texture(textures.sprites, tileUv(tile, inner, ATLAS_ROWS));
  const emblem = texture(textures.emblems, tileUv(tile.sub(EMBLEM_CELL), inner, EMBLEM_ROWS));
  return mix(sprite, emblem, step(EMBLEM_CELL, tile));
}

/**
 * Stars as camera-facing sprites: the vertex stage evaluates the closed form of
 * the spring of domain/spring, the fragment stage draws a glow in the type color
 * with the sprite of the species over it, or the emblem engraved for a move,
 * ability or weather, inked in its color.
 */
export function starMaterial(buffers: StarBuffers, textures: StarTextures): SpriteNodeMaterial {
  const from = instancedBufferAttribute<"vec4">(buffers.from, "vec4");
  const velocity = instancedBufferAttribute<"vec3">(buffers.velocity, "vec3");
  const to = instancedBufferAttribute<"vec3">(buffers.to, "vec3");
  const lookFrom = instancedBufferAttribute<"vec4">(buffers.lookFrom, "vec4");
  const lookTo = instancedBufferAttribute<"vec4">(buffers.lookTo, "vec4");
  const color = varying(instancedBufferAttribute<"vec4">(buffers.color, "vec4"));

  const elapsed = max(starUniforms.time.sub(from.w), 0);
  const offset = from.xyz.sub(to.xyz);
  const drive = velocity.xyz.add(offset.mul(STIFFNESS));
  const position = to.xyz.add(offset.add(drive.mul(elapsed)).mul(exp(elapsed.mul(-STIFFNESS))));
  const eased = float(1).sub(exp(max(starUniforms.time.sub(lookFrom.w), 0).mul(-LOOK_RATE)));
  const look = varying(mix(lookFrom.xyz, lookTo.xyz, eased));

  const centered = uv().sub(0.5);
  const radius = length(centered).mul(2);
  const glow = exp(radius.mul(radius).mul(GLOW_FALLOFF)).mul(look.z);
  const tile = color.w;
  const engraved = step(EMBLEM_CELL, tile);
  const core = smoothstep(0.18, 0.02, radius).mul(min(look.z, 1)).mul(float(1).sub(engraved));
  const inner = centered.div(SPRITE_FILL).add(0.5);
  const sample = tileSample(textures, tile, inner);
  const sprite = sample.a
    .mul(inside(inner))
    .mul(step(0, tile))
    .mul(look.y)
    .mul(starUniforms.atlasReady);
  const ink = mix(sample.rgb, color.xyz.mul(printShade), engraved);
  const halo = color.xyz.mul(glow.mul(printShade)).add(vec3(1, 1, 1).mul(core.mul(0.7)));

  const material = new SpriteNodeMaterial();
  material.positionNode = position;
  material.scaleNode = look.x;
  material.colorNode = vec4(mix(halo, ink, sprite), max(max(glow, core), sprite));
  material.transparent = true;
  material.depthWrite = false;
  return material;
}
