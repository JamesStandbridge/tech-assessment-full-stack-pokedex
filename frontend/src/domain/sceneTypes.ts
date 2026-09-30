import type { EntityKind, EntityRef, Result, SearchResponse } from "../api/contract";
import { displayName, refKey, refOf } from "./entities";
import { centroid, onCircle, type Point, radiusAround } from "./geometry";

/** How the stars are arranged: the home sky, or one arrangement per reading. */
export type SceneLayout = "atlas" | "focus" | "axis" | "hubs" | "rings";

/** How a star is drawn: idle on the home sky, lit as a result, in front as the best match, or dimmed to dust. */
export type Emphasis = "idle" | "lit" | "front" | "dim";

export type RingName = "Setter" | "Benefit" | "Protection" | "Mixed" | "Drawback";

export interface SceneNode {
  readonly id: string;
  readonly label: string;
  readonly kind: EntityKind | "weather";
  /** The entity the node opens; null for the weather itself. */
  readonly ref: EntityRef | null;
  readonly position: Point;
  readonly emphasis: Emphasis;
  readonly rank: number | null;
  readonly ring: RingName | null;
}

export interface SceneLink {
  readonly source: string;
  readonly target: string;
  /** From 0 to 1: the chance of the effect, or how much a weather role helps. */
  readonly strength: number;
}

export interface SceneCamera {
  readonly target: Point;
  readonly distance: number;
}

export interface SceneAxis {
  readonly label: string;
  readonly from: Point;
  readonly to: Point;
  readonly min: number;
  readonly max: number;
}

export interface SceneRing {
  readonly name: RingName;
  readonly radius: number;
}

/** What a reading places on stage; every species it leaves out stays in the sky. */
export interface Staging {
  readonly layout: SceneLayout;
  readonly nodes: readonly SceneNode[];
  readonly links: readonly SceneLink[];
  readonly camera: SceneCamera;
  readonly axis: SceneAxis | null;
  readonly rings: readonly SceneRing[];
  readonly weather: string | null;
  /** Whether the species left out scatter backwards as dust. */
  readonly scatter: boolean;
}

export const NO_STAGE = {
  links: [],
  axis: null,
  rings: [],
  weather: null,
} as const satisfies Partial<Staging>;

const FIT_MARGIN = 2.4;
const MIN_DISTANCE = 12;

export function allResults(response: SearchResponse): readonly Result[] {
  return response.sections.flatMap((section) => section.results);
}

export function resultNode(result: Result, position: Point, emphasis: Emphasis): SceneNode {
  const ref = refOf(result);
  return {
    id: refKey(ref),
    label: displayName(ref.name),
    kind: ref.kind,
    ref,
    position,
    emphasis,
    rank: result.rank,
    ring: null,
  };
}

/** Spread results evenly on a circle, starting at the top. */
export function circlePositions(count: number, radius: number, center: Point): readonly Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI / 2 + (2 * Math.PI * index) / Math.max(count, 1);
    const offset = onCircle(angle, count === 1 ? 0 : radius);
    return { x: center.x + offset.x, y: center.y + offset.y, z: center.z + offset.z };
  });
}

/** Frame a set of points: aim at their center, far enough to see them all. */
export function framing(points: readonly Point[]): SceneCamera {
  const target = centroid(points);
  return { target, distance: Math.max(MIN_DISTANCE, radiusAround(target, points) * FIT_MARGIN) };
}
