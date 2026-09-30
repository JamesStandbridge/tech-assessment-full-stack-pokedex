export interface Point {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const ORIGIN: Point = { x: 0, y: 0, z: 0 };

export function point(x: number, y: number, z: number): Point {
  return { x, y, z };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scale(a: Point, factor: number): Point {
  return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Return the point at an angle on a circle of the vertical plane facing the camera. */
export function onCircle(angle: number, radius: number, z = 0): Point {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z };
}

export function centroid(points: readonly Point[]): Point {
  if (points.length === 0) {
    return ORIGIN;
  }
  const sum = points.reduce(add, ORIGIN);
  return scale(sum, 1 / points.length);
}

/** Return the distance from a center to its farthest point. */
export function radiusAround(center: Point, points: readonly Point[]): number {
  return points.reduce((radius, other) => Math.max(radius, distance(center, other)), 0);
}
