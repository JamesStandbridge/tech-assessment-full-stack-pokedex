import {
  atan,
  cos,
  float,
  Fn,
  fract,
  hash,
  instancedArray,
  instanceIndex,
  length,
  min,
  mix,
  sin,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";
import {
  AdditiveBlending,
  Color,
  type ComputeNode,
  type Node,
  SpriteNodeMaterial,
  Sprite,
  Vector2,
  Vector3,
} from "three/webgpu";

import { weatherHex } from "../palette";
import { glowOrPrint, printShade } from "./ink";

/** The box the motes wrap around in, centered behind the constellation. */
const BOX_MIN = vec3(-40, -26, -40);
const BOX_SIZE = vec3(80, 52, 60);
const EASE_RATE = 1.5;
const AMBIENT_COLOR = "#8fa3d9";

interface Climate {
  readonly wind: Vector3;
  readonly glow: number;
  readonly swirl: number;
  readonly streak: Vector2;
  readonly color: Color;
}

const CALM: Climate = {
  wind: new Vector3(0, 0, 0),
  glow: 1,
  swirl: 1,
  streak: new Vector2(0.08, 0.08),
  color: new Color(AMBIENT_COLOR),
};

const CLIMATES: Readonly<Record<string, Omit<Climate, "color">>> = {
  rain: { wind: new Vector3(-5, -30, 0), glow: 0.4, swirl: 0.1, streak: new Vector2(0.025, 0.5) },
  sun: { wind: new Vector3(0, 2.2, 0), glow: 0.8, swirl: 0.6, streak: new Vector2(0.14, 0.14) },
  sandstorm: {
    wind: new Vector3(18, -1, 2),
    glow: 0.55,
    swirl: 2.2,
    streak: new Vector2(0.12, 0.05),
  },
  hail: { wind: new Vector3(-2, -16, 0), glow: 0.7, swirl: 0.2, streak: new Vector2(0.11, 0.11) },
};

function climateOf(weather: string | null): Climate {
  const climate = weather === null ? undefined : CLIMATES[weather];
  if (weather === null || climate === undefined) return CALM;
  return { ...climate, color: new Color(weatherHex(weather)) };
}

/**
 * Dust drifting around the sky, which a weather turns into rain, embers, sand or
 * hail: positions and velocities live in storage buffers moved by a compute shader.
 */
export class Motes {
  readonly object: Sprite;
  /** Spreads the motes through the box; run once before the first frame. */
  readonly scatter: ComputeNode;
  private readonly compute: ComputeNode;
  private readonly wind = uniform(new Vector3());
  private readonly swirl = uniform(1);
  private readonly glow = uniform(1);
  private readonly streak = uniform(new Vector2(0.08, 0.08));
  private readonly tint = uniform(new Color(AMBIENT_COLOR));
  private readonly delta = uniform(0);
  private readonly clock = uniform(0);
  private goal: Climate = CALM;

  constructor(count: number) {
    const positions = instancedArray(count, "vec3");
    const velocities = instancedArray(count, "vec3");
    const seed = hash(instanceIndex);
    const scatter = Fn(() => {
      const start = vec3(
        hash(instanceIndex.add(1)),
        hash(instanceIndex.add(2)),
        hash(instanceIndex.add(3)),
      );
      positions.element(instanceIndex).assign(start.mul(BOX_SIZE).add(BOX_MIN));
    })().compute(count);
    this.compute = Fn(() => {
      const position = positions.element(instanceIndex);
      const velocity = velocities.element(instanceIndex);
      const drift = vec3(
        sin(position.y.mul(0.21).add(this.clock.mul(0.3)).add(seed.mul(6.28))),
        cos(position.x.mul(0.17).add(this.clock.mul(0.23))),
        sin(position.x.mul(0.13).sub(this.clock.mul(0.2))),
      ).mul(this.swirl);
      const goal = this.wind.mul(mix(float(0.7), float(1.3), seed)).add(drift);
      velocity.assign(mix(velocity, goal, min(this.delta.mul(2), 1)));
      const moved = position.add(velocity.mul(this.delta));
      position.assign(fract(moved.sub(BOX_MIN).div(BOX_SIZE)).mul(BOX_SIZE).add(BOX_MIN));
    })().compute(count);
    this.object = new Sprite(this.material(positions.toAttribute(), seed));
    this.object.count = count;
    this.object.frustumCulled = false;
    this.scatter = scatter;
  }

  setWeather(weather: string | null): void {
    this.goal = climateOf(weather);
  }

  step(delta: number, time: number): ComputeNode {
    const ease = 1 - Math.exp(-EASE_RATE * delta);
    this.wind.value.lerp(this.goal.wind, ease);
    this.swirl.value += (this.goal.swirl - this.swirl.value) * ease;
    this.glow.value += (this.goal.glow - this.glow.value) * ease;
    this.streak.value.lerp(this.goal.streak, ease);
    this.tint.value.lerp(this.goal.color, ease);
    this.delta.value = Math.min(delta, 0.05);
    this.clock.value = time;
    return this.compute;
  }

  private material(position: Node<"vec3">, seed: Node<"float">): SpriteNodeMaterial {
    const falloff = smoothstep(0.5, 0.05, length(uv().sub(0.5)));
    const brightness = falloff.mul(mix(float(0.25), float(0.8), seed)).mul(this.glow);
    const material = new SpriteNodeMaterial();
    material.positionNode = position;
    material.scaleNode = this.streak.mul(mix(float(0.6), float(1.4), seed));
    material.rotationNode = atan(this.wind.x, this.wind.y.negate().add(0.001));
    const faded = brightness.mul(printShade);
    material.colorNode = vec4(this.tint.mul(faded), faded);
    material.transparent = true;
    material.depthWrite = false;
    material.blending = AdditiveBlending;
    return glowOrPrint(material);
  }
}
