import type { ComponentType, JSX } from "react";

import type { Reading } from "../../domain/reading";
import { CriteriaView } from "./CriteriaView";
import { AddToTeam } from "../team/TeamTray";
import { chanceBadge, type Decoration, roleBadge } from "./decorations";
import { NameView } from "./NameView";
import { type ResultsViewProps, Sections } from "./Sections";

function EffectView(props: ResultsViewProps): JSX.Element {
  return <Sections {...props} decorate={chanceBadge} />;
}

function WeatherView(props: ResultsViewProps): JSX.Element {
  const weather = props.response.interpretation.alternatives[0]?.weather?.weather ?? null;
  const decorate: Decoration = (result) => (
    <div className="flex flex-wrap items-center gap-2">
      {roleBadge(result)}
      {result.kind === "pokemon" ? <AddToTeam pokemon={result} weather={weather} /> : null}
    </div>
  );
  return <Sections {...props} decorate={decorate} />;
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
