import { type ComponentType, type JSX, lazy, Suspense } from "react";

import { linkLabel, type RelationGraph as Graph, weatherGraph } from "../../domain/graph";
import type { Reading } from "../../domain/reading";
import { CriteriaView } from "./CriteriaView";
import { AddToTeam } from "../team/TeamTray";
import { chanceBadge, type Decoration, roleBadge } from "./decorations";
import { NameView } from "./NameView";
import { type ResultsViewProps, Sections } from "./Sections";

const RelationGraph = lazy(async () => {
  const module = await import("../extras/RelationGraph");
  return { default: module.RelationGraph };
});

function EffectView(props: ResultsViewProps): JSX.Element {
  return <Sections {...props} decorate={chanceBadge} />;
}

/** Holds the place of the graph while it loads, so the sections below do not shift. */
function GraphPlaceholder(): JSX.Element {
  return (
    <div aria-hidden="true" className="rounded-card border-line aspect-[760/440] w-full border" />
  );
}

/** The relations of the graph in words, rendered at once while the drawing loads. */
function RelationList({ graph }: { readonly graph: Graph }): JSX.Element {
  return (
    <ul
      aria-label="Relations"
      className="text-muted columns-1 gap-6 text-sm sm:columns-2 lg:columns-3"
    >
      {graph.links.map((link) => (
        <li key={`${link.source}>${link.target}`}>{linkLabel(graph, link)}</li>
      ))}
    </ul>
  );
}

function WeatherView(props: ResultsViewProps): JSX.Element {
  const graph = weatherGraph(props.response);
  const weather = props.response.interpretation.alternatives[0]?.weather?.weather ?? null;
  const decorate: Decoration = (result) => (
    <div className="flex flex-wrap items-center gap-2">
      {roleBadge(result)}
      {result.kind === "pokemon" ? <AddToTeam pokemon={result} weather={weather} /> : null}
    </div>
  );
  return (
    <>
      {graph === null ? null : (
        <div className="space-y-3">
          <Suspense fallback={<GraphPlaceholder />}>
            <RelationGraph graph={graph} onOpen={props.onOpen} />
          </Suspense>
          <RelationList graph={graph} />
        </div>
      )}
      <Sections {...props} decorate={decorate} />
    </>
  );
}

function ExplorationView(props: ResultsViewProps): JSX.Element {
  return <Sections {...props} />;
}

/** One view per reading (ADR 10); a new reading does not compile until it has a view. */
export const RESULT_VIEWS = {
  name: NameView,
  weather: WeatherView,
  effect: EffectView,
  criteria: CriteriaView,
  exploration: ExplorationView,
} satisfies Record<Reading, ComponentType<ResultsViewProps>>;
