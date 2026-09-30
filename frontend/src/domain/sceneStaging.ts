import type { Result, SearchResponse } from "../api/contract";
import type { Constellation } from "./constellation";
import { refKey, refOf } from "./entities";
import { centroid, point, type Point } from "./geometry";
import {
  allResults,
  circlePositions,
  framing,
  NO_STAGE,
  resultNode,
  type SceneNode,
  type Staging,
} from "./sceneTypes";
import { comparedStats, STAT_LABELS, statValue } from "./stats";

const FOCUS_DISTANCE = 7;
const SATELLITE_RADIUS = 3.5;
const AXIS_HALF_WIDTH = 13;
const AXIS_HALF_HEIGHT = 6;
const AXIS_DISTANCE = 36;
const STAGGER_ROWS = 5;
const STAGGER_STEP = 1.3;
const DEPTH_ROWS = 3;
const DEPTH_STEP = 1.2;

function placeOf(places: Constellation, result: Result): Point | null {
  return result.kind === "pokemon" ? (places.get(result.name) ?? null) : null;
}

/** Stage the species in the sky where they are, and the moves and abilities around them. */
function stageInPlace(
  places: Constellation,
  results: readonly Result[],
  front: string | null,
): readonly SceneNode[] {
  const placed = results.flatMap((result) => {
    const place = placeOf(places, result);
    return place === null ? [] : [{ result, place }];
  });
  const center = centroid(placed.map((entry) => entry.place));
  const unplaced = results.filter((result) => placeOf(places, result) === null);
  const around = circlePositions(unplaced.length, SATELLITE_RADIUS, center);
  const emphasis = (result: Result): "front" | "lit" =>
    refKey(refOf(result)) === front ? "front" : "lit";
  return [
    ...placed.map(({ result, place }) => resultNode(result, place, emphasis(result))),
    ...unplaced.map((result, index) =>
      resultNode(result, around[index] ?? center, emphasis(result)),
    ),
  ];
}

/** Exploration: the results light up where they are in the sky. */
export function litStaging(places: Constellation, response: SearchResponse): Staging {
  const nodes = stageInPlace(places, allResults(response), null);
  return {
    ...NO_STAGE,
    layout: "atlas",
    nodes,
    camera: framing(nodes.map((node) => node.position)),
    scatter: false,
  };
}

/** Name: the camera flies to the best match, the other matches stay lit around it. */
export function focusStaging(places: Constellation, response: SearchResponse): Staging {
  const front = response.best_match === null ? null : refKey(response.best_match);
  const nodes = stageInPlace(places, allResults(response), front);
  const best = nodes.find((node) => node.emphasis === "front");
  return {
    ...NO_STAGE,
    layout: "focus",
    nodes,
    camera:
      best === undefined
        ? framing(nodes.map((node) => node.position))
        : { target: best.position, distance: FOCUS_DISTANCE, aspect: 1 },
    scatter: false,
  };
}

interface Range {
  readonly min: number;
  readonly max: number;
}

function spread(value: number, range: Range, half: number): number {
  const { min, max } = range;
  return max === min ? 0 : ((value - min) / (max - min)) * 2 * half - half;
}

interface Measured {
  readonly result: Result;
  readonly value: number;
  readonly second: number | null;
}

function bounds(values: readonly number[]): Range {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Criteria: the results line up on the axis of the first compared stat, and on a
 * second axis when the query compares two; the rest of the sky scatters.
 */
export function axisStaging(places: Constellation, response: SearchResponse): Staging | null {
  const [stat, secondStat] = comparedStats(response.interpretation.alternatives[0]);
  if (stat === undefined) return null;
  const measured = allResults(response).flatMap((result): Measured[] => {
    const value = statValue(result, stat);
    const second = secondStat === undefined ? null : statValue(result, secondStat);
    return value === null ? [] : [{ result, value, second }];
  });
  if (measured.length === 0 || places.size === 0) return null;
  const x = bounds(measured.map((entry) => entry.value));
  const y = bounds(measured.flatMap((entry) => entry.second ?? []));
  const nodes = measured.map(({ result, value, second }) => {
    const row = (result.rank - 1) % STAGGER_ROWS;
    const height =
      second === null
        ? (row - (STAGGER_ROWS - 1) / 2) * STAGGER_STEP
        : spread(second, y, AXIS_HALF_HEIGHT);
    const depth = -((result.rank - 1) % DEPTH_ROWS) * DEPTH_STEP;
    return resultNode(result, point(spread(value, x, AXIS_HALF_WIDTH), height, depth), "lit");
  });
  const base = -AXIS_HALF_HEIGHT - 2;
  return {
    ...NO_STAGE,
    layout: "axis",
    nodes,
    axis: {
      label: STAT_LABELS[stat],
      from: point(-AXIS_HALF_WIDTH, base, 0),
      to: point(AXIS_HALF_WIDTH, base, 0),
      min: x.min,
      max: x.max,
    },
    camera: { target: point(0, 0, 0), distance: AXIS_DISTANCE, aspect: 1 },
    scatter: true,
  };
}
