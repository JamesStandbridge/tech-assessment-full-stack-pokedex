import type { Species, Stats } from "../api/contract";
import { centroid, distance, type Point } from "./geometry";
import { centerColumns, type Matrix, principalAxes, projection } from "./pca";

/** Where every species sits in the constellation, by name. */
export type Constellation = ReadonlyMap<string, Point>;

export interface Cluster {
  readonly type: string;
  readonly center: Point;
  readonly size: number;
}

const STATS: readonly (keyof Stats)[] = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];
/** Weight of a shared type against one standard deviation of a stat. */
const TYPE_WEIGHT = 1.6;
const EXTENTS: readonly number[] = [15, 10, 7];
const MIN_GAP = 0.9;
const SEPARATION_PASSES = 30;
const MIN_CLUSTER = 3;
const NEIGHBOURHOOD = 5;
const LABEL_GAP = 4.5;

function standardized(species: readonly Species[], stat: keyof Stats): readonly number[] {
  const values = species.map((one) => one.stats[stat]);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const deviation = Math.sqrt(variance) || 1;
  return values.map((value) => (value - mean) / deviation);
}

function features(species: readonly Species[], types: readonly string[]): Matrix {
  const cols = STATS.length + types.length;
  const data = new Float64Array(species.length * cols);
  STATS.forEach((stat, col) => {
    standardized(species, stat).forEach((value, row) => {
      data[row * cols + col] = value;
    });
  });
  species.forEach((one, row) => {
    for (const type of one.types) {
      data[row * cols + STATS.length + types.indexOf(type)] = TYPE_WEIGHT;
    }
  });
  const matrix = { rows: species.length, cols, data };
  centerColumns(matrix);
  return matrix;
}

function fitted(coordinates: Float64Array, extent: number): Float64Array {
  const largest = coordinates.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
  return coordinates.map((value) => (value / largest) * extent);
}

function pushApart(points: Float64Array, first: number, second: number): void {
  const delta = [0, 1, 2].map(
    (axis) => (points[second * 3 + axis] ?? 0) - (points[first * 3 + axis] ?? 0),
  );
  const length = Math.hypot(...delta);
  if (length >= MIN_GAP) {
    return;
  }
  const direction =
    length > 1e-9 ? delta.map((value) => value / length) : [Math.cos(first), Math.sin(first), 0];
  const push = (MIN_GAP - length) / 2;
  direction.forEach((value, axis) => {
    points[first * 3 + axis] = (points[first * 3 + axis] ?? 0) - value * push;
    points[second * 3 + axis] = (points[second * 3 + axis] ?? 0) + value * push;
  });
}

/** Nudge apart the stars that would overlap, such as two species with the same profile. */
function separate(points: Float64Array): void {
  const count = points.length / 3;
  for (let pass = 0; pass < SEPARATION_PASSES; pass += 1) {
    for (let first = 0; first < count; first += 1) {
      for (let second = first + 1; second < count; second += 1) {
        pushApart(points, first, second);
      }
    }
  }
}

/**
 * Place every species by similarity: the classical multidimensional scaling of
 * their standardized base stats and types, which for Euclidean distances is
 * their projection on the first three principal axes. Deterministic.
 */
export function constellation(species: readonly Species[]): Constellation {
  const types = [...new Set(species.flatMap((one) => one.types))].sort();
  const matrix = features(species, types);
  const axes = principalAxes(matrix, EXTENTS.length).map((axis, index) =>
    fitted(projection(matrix, axis), EXTENTS[index] ?? 1),
  );
  const points = new Float64Array(species.length * 3);
  axes.forEach((coordinates, axis) => {
    coordinates.forEach((value, row) => {
      points[row * 3 + axis] = value;
    });
  });
  separate(points);
  return new Map(
    species.map((one, row) => [
      one.name,
      { x: points[row * 3] ?? 0, y: points[row * 3 + 1] ?? 0, z: points[row * 3 + 2] ?? 0 },
    ]),
  );
}

function densestGroup(members: readonly Point[]): readonly Point[] {
  const around = (center: Point): readonly Point[] =>
    members.filter((other) => distance(center, other) <= NEIGHBOURHOOD);
  return members.reduce<readonly Point[]>((best, member) => {
    const group = around(member);
    return group.length > best.length ? group : best;
  }, []);
}

/**
 * Return the named groups of the home view: where the species of each primary
 * type gather most densely, largest first, without two names on top of each other.
 */
export function typeClusters(
  species: readonly Species[],
  places: Constellation,
): readonly Cluster[] {
  const groups = new Map<string, Point[]>();
  for (const one of species) {
    const type = one.types[0] ?? "";
    const place = places.get(one.name);
    if (place !== undefined) groups.set(type, [...(groups.get(type) ?? []), place]);
  }
  const candidates = [...groups.entries()]
    .map(([type, members]) => ({ type, members, core: densestGroup(members) }))
    .filter((group) => group.core.length >= MIN_CLUSTER)
    .map((group) => ({
      type: group.type,
      size: group.members.length,
      center: centroid(group.core),
    }))
    .sort((a, b) => b.size - a.size || a.type.localeCompare(b.type));
  return candidates.reduce<readonly Cluster[]>(
    (kept, cluster) =>
      kept.some((other) => distance(other.center, cluster.center) < LABEL_GAP)
        ? kept
        : [...kept, cluster],
    [],
  );
}
