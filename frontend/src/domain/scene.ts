import type { SearchResponse } from "../api/contract";
import { assertNever } from "./assertNever";
import type { Constellation } from "./constellation";
import { displayName } from "./entities";
import { point, type Point } from "./geometry";
import { readingOf } from "./reading";
import { hubStaging, ringStaging } from "./sceneRelations";
import { axisStaging, focusStaging, litStaging } from "./sceneStaging";
import {
  NO_STAGE,
  type SceneAxis,
  type SceneCamera,
  type SceneLayout,
  type SceneLink,
  type SceneNode,
  type SceneRing,
  type Staging,
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

const HOME_CAMERA: SceneCamera = { target: point(0, 0, 0), distance: 24 };
const DUST_SPREAD = 1.7;
const DUST_DEPTH = 14;

const HOME: Staging = {
  ...NO_STAGE,
  layout: "atlas",
  nodes: [],
  camera: HOME_CAMERA,
  scatter: false,
};

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
  const stage = response === null ? HOME : staging(places, response);
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
