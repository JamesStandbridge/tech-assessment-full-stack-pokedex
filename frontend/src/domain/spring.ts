import { add, type Point, scale } from "./geometry";

/**
 * A critically damped spring from a start, with an initial velocity, towards a
 * target. Its closed form lets the vertex shader and the page compute the same
 * position at any time without reading anything back from the GPU.
 */
export interface Spring {
  readonly from: Point;
  readonly velocity: Point;
  readonly to: Point;
  /** When the spring is released, in seconds. */
  readonly start: number;
}

export interface Motion {
  readonly position: Point;
  readonly velocity: Point;
}

/** Angular frequency, per second: the spring covers 95% of the way in about 1.1 s. */
export const STIFFNESS = 4.2;
const SETTLED_AFTER = 8 / STIFFNESS;

export function restingSpring(at: Point): Spring {
  return { from: at, velocity: { x: 0, y: 0, z: 0 }, to: at, start: 0 };
}

export function springAt(spring: Spring, time: number): Motion {
  const elapsed = Math.max(0, time - spring.start);
  const decay = Math.exp(-STIFFNESS * elapsed);
  const offset = add(spring.from, scale(spring.to, -1));
  const drive = add(spring.velocity, scale(offset, STIFFNESS));
  return {
    position: add(spring.to, scale(add(offset, scale(drive, elapsed)), decay)),
    velocity: scale(add(spring.velocity, scale(drive, -STIFFNESS * elapsed)), decay),
  };
}

export interface Release {
  readonly time: number;
  readonly delay: number;
}

/** Send a spring to a new target from wherever it is now, after a delay. */
export function retarget(spring: Spring, to: Point, release: Release): Spring {
  const now = springAt(spring, release.time);
  return { from: now.position, velocity: now.velocity, to, start: release.time + release.delay };
}

export function isSettled(spring: Spring, time: number): boolean {
  return time - spring.start > SETTLED_AFTER;
}
