import type { SearchResponse } from "../api/contract";
import { assertNever } from "./assertNever";
import type { Constellation } from "./constellation";
import { displayName } from "./entities";
import { point, type Point } from "./geometry";
import { readingOf } from "./reading";
import { hubStaging, ringStaging } from "./sceneRelations";
import { axisStaging, focusStaging, litStaging } from "./sceneStaging";
import {
  lens,
  NO_STAGE,
  type SceneAxis,
  type SceneCamera,
  type SceneLayout,
  type SceneLink,
  type SceneNode,
  type SceneRing,
  type Staging,
  VIEW_HEIGHT,
} from "./sceneTypes";

export interface SceneFrame {
  readonly layout: SceneLayout;
  /** Every species, then the moves, abilities and weather a reading adds. */
  readonly nodes: readonly SceneNode[];
  readonly links: readonly SceneLink[];
  readonly camera: SceneCamera;
  readonly axis: SceneAxis | null;
  readonly rings: readonly SceneRing[];
  readonly weather: string | null;
}

const DUST_SPREAD = 1.7;
const DUST_DEPTH = 14;
/** The home sky is framed on this share of the species along each axis; the others may reach the edges. */
const HOME_SHARE = 0.98;
/** A margin of this share of the free area on every side of the bulk. */
const HOME_MARGIN = 0.09;
const HOME_AIR = 1 / (1 - 2 * HOME_MARGIN);
const MIN_HOME_REACH = 1;
/** The distance depends on how near stars look, which depends on the distance: a few passes settle it. */
const HOME_PASSES = 4;

/** Where the bulk of the species lies along one axis, and how far it spreads from there. */
interface Span {
  readonly middle: number;
  readonly half: number;
}

function span(values: readonly number[]): Span {
  const sorted = [...values].sort((a, b) => a - b);
  const last = sorted.length - 1;
  const low = sorted[Math.round(((1 - HOME_SHARE) / 2) * last)] ?? 0;
  const high = sorted[Math.round(((1 + HOME_SHARE) / 2) * last)] ?? 0;
  return {
    middle: (low + high) / 2,
    half: Math.max(MIN_HOME_REACH, ((high - low) / 2) * HOME_AIR),
  };
}

interface Spread {
  readonly across: Span;
  readonly up: Span;
}

/** How the bulk spreads on screen, in units at the target, seen from the front at a distance. */
function spreadAt(points: readonly Point[], distance: number): Spread {
  return {
    across: span(points.map((place) => place.x * lens(distance, place.z))),
    up: span(points.map((place) => place.y * lens(distance, place.z))),
  };
}

function distanceOf(spread: Spread): number {
  return (2 * spread.up.half) / VIEW_HEIGHT;
}

/** Frame the bulk of the home sky as the camera sees it, centered, with a margin, as wide as it spreads. */
export function homeCamera(places: Constellation): SceneCamera {
  const points = [...places.values()];
  const distance = Array.from({ length: HOME_PASSES }).reduce<number>(
    (current) => distanceOf(spreadAt(points, current)),
    Number.MAX_VALUE,
  );
  const spread = spreadAt(points, distance);
  return {
    target: point(spread.across.middle, spread.up.middle, 0),
    distance: distanceOf(spread),
    aspect: spread.across.half / spread.up.half,
  };
}

function home(places: Constellation): Staging {
  return { ...NO_STAGE, layout: "atlas", nodes: [], camera: homeCamera(places), scatter: false };
}

function dust(place: Point): Point {
  return point(place.x * DUST_SPREAD, place.y * DUST_SPREAD, place.z * DUST_SPREAD - DUST_DEPTH);
}

function staging(places: Constellation, response: SearchResponse): Staging {
  const reading = readingOf(response);
  switch (reading) {
    case "name":
      return focusStaging(places, response);
    case "criteria":
      return axisStaging(places, response) ?? litStaging(places, response);
    case "effect":
      return hubStaging(response);
    case "weather":
      return ringStaging(response) ?? litStaging(places, response);
    case "exploration":
      return litStaging(places, response);
    default:
      return assertNever(reading);
  }
}

/**
 * Return the target of every star for a response, or for the home sky when
 * there is none: the engine springs towards it, the still map draws it.
 */
export function sceneFrame(places: Constellation, response: SearchResponse | null): SceneFrame {
  const stage = response === null ? home(places) : staging(places, response);
  const staged = new Map(stage.nodes.map((node) => [node.id, node]));
  const sky = [...places.entries()].map(([name, place]): SceneNode => {
    const id = `pokemon:${name}`;
    return (
      staged.get(id) ?? {
        id,
        label: displayName(name),
        kind: "pokemon",
        ref: { kind: "pokemon", name },
        position: stage.scatter ? dust(place) : place,
        emphasis: response === null ? "idle" : "dim",
        rank: null,
        ring: null,
        emblem: null,
      }
    );
  });
  const extra = stage.nodes.filter((node) => node.kind !== "pokemon");
  const { layout, links, camera, axis, rings, weather } = stage;
  return { layout, nodes: [...sky, ...extra], links, camera, axis, rings, weather };
}

/** Return the nodes linked to a node, to highlight them with it. */
export function neighbours(frame: SceneFrame, id: string): ReadonlySet<string> {
  const linked = frame.links.flatMap((link) => {
    if (link.source === id) return [link.target];
    if (link.target === id) return [link.source];
    return [];
  });
  return new Set([id, ...linked]);
}

/** Describe a link in words, for the list that accompanies the constellation. */
export function linkLabel(frame: SceneFrame, link: SceneLink): string {
  const label = (id: string): string => frame.nodes.find((node) => node.id === id)?.label ?? id;
  return `${label(link.source)} → ${label(link.target)}`;
}

/** Return the nodes worth naming: the results, hubs and weather of a reading. */
export function namedNodes(frame: SceneFrame): readonly SceneNode[] {
  return frame.nodes.filter((node) => node.emphasis === "lit" || node.emphasis === "front");
}
