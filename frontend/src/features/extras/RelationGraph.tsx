import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force";
import type { JSX, KeyboardEvent } from "react";

import type { EntityRef } from "../../api/contract";
import type { GraphNode, RelationGraph as Graph } from "../../domain/graph";

const WIDTH = 760;
const HEIGHT = 440;
const TICKS = 300;
const RADIUS: Readonly<Record<GraphNode["group"], number>> = {
  weather: 22,
  ability: 12,
  move: 12,
  pokemon: 7,
};
const COLOR: Readonly<Record<GraphNode["group"], string>> = {
  weather: "var(--color-tone-weather)",
  ability: "var(--color-tone-trait)",
  move: "var(--color-tone-effect)",
  pokemon: "var(--color-tone-type)",
};

interface Placed extends SimulationNodeDatum {
  readonly id: string;
}

/** Place the nodes once, by running a fixed number of ticks of a force simulation. */
function layout(graph: Graph): ReadonlyMap<string, { readonly x: number; readonly y: number }> {
  const placed: Placed[] = graph.nodes.map((node) => ({ id: node.id }));
  const links = graph.links.map((link) => ({ source: link.source, target: link.target }));
  const simulation = forceSimulation(placed)
    .force(
      "link",
      forceLink<Placed, (typeof links)[number]>(links)
        .id((node) => node.id)
        .distance(70),
    )
    .force("charge", forceManyBody().strength(-160))
    .force("collide", forceCollide(18))
    .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
    .stop();
  simulation.tick(TICKS);
  const clamp = (value: number, max: number): number => Math.min(Math.max(value, 24), max - 24);
  return new Map(
    placed.map((node) => [
      node.id,
      { x: clamp(node.x ?? 0, WIDTH), y: clamp(node.y ?? 0, HEIGHT) },
    ]),
  );
}

function Node(props: {
  readonly node: GraphNode;
  readonly at: { readonly x: number; readonly y: number };
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { node, at, onOpen } = props;
  const ref = node.ref;
  const shape = (
    <>
      <circle r={RADIUS[node.group]} fill={COLOR[node.group]} opacity={0.85} />
      <text y={RADIUS[node.group] + 12} textAnchor="middle" className="fill-text text-[11px]">
        {node.label}
      </text>
    </>
  );
  if (ref === null) return <g transform={`translate(${String(at.x)},${String(at.y)})`}>{shape}</g>;
  const open = (event?: KeyboardEvent<SVGGElement>): void => {
    if (event !== undefined && event.key !== "Enter" && event.key !== " ") return;
    event?.preventDefault();
    onOpen(ref);
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={node.label}
      transform={`translate(${String(at.x)},${String(at.y)})`}
      className="focus-visible:[&>circle]:stroke-focus cursor-pointer outline-none focus-visible:[&>circle]:stroke-[3]"
      onClick={() => {
        open();
      }}
      onKeyDown={open}
    >
      {shape}
    </g>
  );
}

/** The weather, abilities, moves and Pokémon of a strategy as a navigable graph. */
export function RelationGraph(props: {
  readonly graph: Graph;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { graph } = props;
  const positions = layout(graph);
  const at = (id: string): { readonly x: number; readonly y: number } =>
    positions.get(id) ?? { x: 0, y: 0 };
  return (
    <figure
      aria-label="Relation graph"
      className="rounded-card border-line bg-panel/70 overflow-hidden border"
    >
      <svg viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`} className="h-auto w-full">
        <g aria-hidden="true" className="stroke-line">
          {graph.links.map((link) => (
            <line
              key={`${link.source}>${link.target}`}
              x1={at(link.source).x}
              y1={at(link.source).y}
              x2={at(link.target).x}
              y2={at(link.target).y}
            />
          ))}
        </g>
        {graph.nodes.map((node) => (
          <Node key={node.id} node={node} at={at(node.id)} onOpen={props.onOpen} />
        ))}
      </svg>
    </figure>
  );
}
