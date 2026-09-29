import type { EntityKind, EntityRef, SearchResponse } from "../api/contract";
import { displayName, refKey, refOf } from "./entities";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  /** The entity the node opens; null for the weather itself. */
  readonly ref: EntityRef | null;
  readonly group: "weather" | EntityKind;
}

export interface GraphLink {
  readonly source: string;
  readonly target: string;
}

export interface RelationGraph {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
}

/**
 * Relations of a weather strategy (SYS-UI-012): the weather links to every
 * ability and move shown, and each Pokémon hangs from the ability or move it
 * benefits through, or from the weather when its reason names no entity.
 */
export function weatherGraph(response: SearchResponse): RelationGraph | null {
  const weather = response.interpretation.alternatives[0]?.weather?.weather;
  if (weather === undefined) return null;
  const root: GraphNode = {
    id: `weather:${weather}`,
    label: displayName(weather),
    ref: null,
    group: "weather",
  };
  const results = response.sections.flatMap((section) => section.results);
  const nodes = [
    root,
    ...results.map((result) => {
      const ref = refOf(result);
      return { id: refKey(ref), label: displayName(ref.name), ref, group: ref.kind };
    }),
  ];
  const known = new Set(nodes.map((node) => node.id));
  const links = new Map<string, GraphLink>();
  const add = (source: string, target: string): void => {
    links.set(`${source}>${target}`, { source, target });
  };
  for (const result of results) {
    const target = refKey(refOf(result));
    const sources = result.reasons
      .map((reason) => (reason.related === null ? root.id : refKey(reason.related)))
      .filter((source) => known.has(source) && source !== target);
    for (const source of sources.length > 0 ? sources : [root.id]) add(source, target);
  }
  return { nodes, links: [...links.values()] };
}

/** Describe a link in words, for the list that accompanies the graph. */
export function linkLabel(graph: RelationGraph, link: GraphLink): string {
  const label = (id: string): string => graph.nodes.find((node) => node.id === id)?.label ?? id;
  return `${label(link.source)} → ${label(link.target)}`;
}
