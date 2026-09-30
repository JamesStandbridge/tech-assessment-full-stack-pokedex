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

export const ATLAS_COLUMNS = 16;
export const ATLAS_ROWS = 10;
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

/**
 * Stars as camera-facing sprites: the vertex stage evaluates the closed form of
 * the spring of domain/spring, the fragment stage draws a glow in the type color
 * with the sprite of the species over it.
 */
export function starMaterial(buffers: StarBuffers, atlas: Texture): SpriteNodeMaterial {
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
  const core = smoothstep(0.18, 0.02, radius).mul(min(look.z, 1));
  const inner = centered.div(SPRITE_FILL).add(0.5);
  const tile = color.w;
  const cell = vec2(mod(tile, ATLAS_COLUMNS), floor(tile.div(ATLAS_COLUMNS)));
  const atlasUv = vec2(
    cell.x.add(inner.x).div(ATLAS_COLUMNS),
    float(ATLAS_ROWS).sub(cell.y).sub(1).add(inner.y).div(ATLAS_ROWS),
  );
  const sample = texture(atlas, atlasUv);
  const sprite = sample.a
    .mul(inside(inner))
    .mul(step(0, tile))
    .mul(look.y)
    .mul(starUniforms.atlasReady);
  const halo = color.xyz.mul(glow).add(vec3(1, 1, 1).mul(core.mul(0.7)));

  const material = new SpriteNodeMaterial();
  material.positionNode = position;
  material.scaleNode = look.x;
  material.colorNode = vec4(mix(halo, sample.rgb, sprite), max(max(glow, core), sprite));
  material.transparent = true;
  material.depthWrite = false;
  return material;
}
