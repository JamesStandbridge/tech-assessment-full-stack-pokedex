import type { Result, SearchResponse, WeatherRole } from "../api/contract";
import { displayName, refKey, refOf } from "./entities";
import { add, onCircle, ORIGIN, type Point } from "./geometry";
import {
  allResults,
  circlePositions,
  NO_STAGE,
  resultNode,
  type RingName,
  type SceneLink,
  type SceneNode,
  type SceneRing,
  type Staging,
} from "./sceneTypes";

const HUB_LIMIT = 10;
const HUB_RADIUS = 9;
const GOLDEN_ANGLE = 2.399963;
const SATELLITE_BASE = 1.6;
const SATELLITE_GROWTH = 0.45;
const LOOSE_RADIUS = 16;
const HUBS_DISTANCE = 40;
const MECHANISM_RADIUS = 3.5;
const RING_DISTANCE_FACTOR = 3;
const DRAWBACK_STRENGTH = 0.35;

interface RingSpec {
  readonly name: RingName;
  readonly radius: number;
  readonly order: number;
}

const RINGS: Readonly<Record<WeatherRole, RingSpec>> = {
  setter: { name: "Setter", radius: 6.5, order: 0 },
  benefit: { name: "Benefit", radius: 9.5, order: 1 },
  protection: { name: "Protection", radius: 12, order: 2 },
  mixed: { name: "Mixed", radius: 14, order: 3 },
  drawback: { name: "Drawback", radius: 16.5, order: 4 },
};

/** The ring of a Pokémon: its most helpful weather role across all its reasons. */
function ringOf(result: Result): RingSpec {
  const specs = result.reasons.flatMap((reason) =>
    reason.weather_role === null ? [] : [RINGS[reason.weather_role]],
  );
  return specs.reduce<RingSpec>(
    (best, spec) => (spec.order < best.order ? spec : best),
    RINGS.mixed,
  );
}

/** The hubs a result hangs from, with the strength of each link. */
function linksTo(result: Result, hubs: ReadonlySet<string>): readonly SceneLink[] {
  const target = refKey(refOf(result));
  const links = new Map<string, SceneLink>();
  for (const reason of result.reasons) {
    const source = reason.related === null ? null : refKey(reason.related);
    if (source !== null && hubs.has(source) && source !== target && !links.has(source)) {
      const strength =
        reason.weather_role === "drawback" ? DRAWBACK_STRENGTH : (reason.probability ?? 1);
      links.set(source, { source, target, strength });
    }
  }
  return [...links.values()];
}

function satellite(center: Point, index: number): Point {
  const radius = SATELLITE_BASE + SATELLITE_GROWTH * Math.sqrt(index);
  return add(center, onCircle(index * GOLDEN_ANGLE, radius, (index % 2) * 1.2 - 0.6));
}

/**
 * Effect: the moves and abilities become hubs on a circle, and every Pokémon
 * gathers around the hub it achieves the effect through, linked with the chance.
 */
export function hubStaging(response: SearchResponse): Staging {
  const results = allResults(response);
  const hubResults = results.filter((result) => result.kind !== "pokemon").slice(0, HUB_LIMIT);
  const hubPositions = circlePositions(hubResults.length, HUB_RADIUS, ORIGIN);
  const hubs = hubResults.map((result, index) =>
    resultNode(result, hubPositions[index] ?? ORIGIN, "lit"),
  );
  const hubIds = new Set(hubs.map((hub) => hub.id));
  const positionOf = new Map(hubs.map((hub) => [hub.id, hub.position]));
  const crowd = new Map<string, number>();
  const links: SceneLink[] = [];
  const pokemon = results
    .filter((result) => result.kind === "pokemon")
    .map((result, index) => {
      const own = linksTo(result, hubIds);
      links.push(...own);
      const anchor = own[0]?.source;
      const center = anchor === undefined ? undefined : positionOf.get(anchor);
      if (anchor === undefined || center === undefined) {
        return resultNode(result, onCircle(index * GOLDEN_ANGLE, LOOSE_RADIUS), "lit");
      }
      const seat = crowd.get(anchor) ?? 0;
      crowd.set(anchor, seat + 1);
      return resultNode(result, satellite(center, seat), "lit");
    });
  return {
    ...NO_STAGE,
    layout: "hubs",
    nodes: [...hubs, ...pokemon],
    links,
    camera: { target: ORIGIN, distance: HUBS_DISTANCE },
    scatter: true,
  };
}

function ringNodes(pokemon: readonly Result[]): readonly SceneNode[] {
  const byRing = new Map<RingSpec, Result[]>();
  for (const result of pokemon) {
    const spec = ringOf(result);
    byRing.set(spec, [...(byRing.get(spec) ?? []), result]);
  }
  return [...byRing.entries()].flatMap(([spec, members]) =>
    members.map((result, index) => {
      const angle = Math.PI / 2 + spec.order * 0.4 + (2 * Math.PI * index) / members.length;
      const depth = (index % 2) * 1.4 - 0.7;
      return { ...resultNode(result, onCircle(angle, spec.radius, depth), "lit"), ring: spec.name };
    }),
  );
}

function weatherNode(weather: string): SceneNode {
  return {
    id: `weather:${weather}`,
    label: displayName(weather),
    kind: "weather",
    ref: null,
    position: ORIGIN,
    emphasis: "front",
    rank: null,
    ring: null,
  };
}

/** Link every Pokémon to the mechanisms it relies on, or to the weather itself. */
function ringLinks(
  root: string,
  pokemon: readonly Result[],
  mechanisms: ReadonlySet<string>,
): readonly SceneLink[] {
  return pokemon.flatMap((result) => {
    const own = linksTo(result, mechanisms);
    const strength = ringOf(result).name === "Drawback" ? DRAWBACK_STRENGTH : 1;
    return own.length > 0 ? own : [{ source: root, target: refKey(refOf(result)), strength }];
  });
}

function ringsOf(pokemon: readonly SceneNode[]): readonly SceneRing[] {
  return Object.values(RINGS)
    .filter((spec) => pokemon.some((node) => node.ring === spec.name))
    .map((spec) => ({ name: spec.name, radius: spec.radius }));
}

/**
 * Weather: the weather sits in the center, its abilities and moves around it,
 * and the Pokémon on rings by role: setters, beneficiaries, then the penalized.
 */
export function ringStaging(response: SearchResponse): Staging | null {
  const weather = response.interpretation.alternatives[0]?.weather?.weather;
  if (weather === undefined) return null;
  const root = weatherNode(weather);
  const results = allResults(response);
  const mechanismResults = results.filter((result) => result.kind !== "pokemon");
  const positions = circlePositions(mechanismResults.length, MECHANISM_RADIUS, ORIGIN);
  const mechanisms = mechanismResults.map((result, index) =>
    resultNode(result, positions[index] ?? ORIGIN, "lit"),
  );
  const pokemonResults = results.filter((result) => result.kind === "pokemon");
  const pokemon = ringNodes(pokemonResults);
  const rings = ringsOf(pokemon);
  const widest = Math.max(MECHANISM_RADIUS, ...rings.map((ring) => ring.radius));
  return {
    ...NO_STAGE,
    layout: "rings",
    nodes: [root, ...mechanisms, ...pokemon],
    links: [
      ...mechanisms.map((node) => ({ source: root.id, target: node.id, strength: 1 })),
      ...ringLinks(root.id, pokemonResults, new Set(mechanisms.map((node) => node.id))),
    ],
    rings,
    weather,
    camera: { target: ORIGIN, distance: widest * RING_DISTANCE_FACTOR },
    scatter: true,
  };
}
