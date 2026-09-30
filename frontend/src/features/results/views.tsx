import type { ComponentType, JSX } from "react";

import type { Reading } from "../../domain/reading";
import { CriteriaView } from "./CriteriaView";
import { chanceBadge, roleBadge } from "./decorations";
import { NameView } from "./NameView";
import { type ResultsViewProps, Sections } from "./Sections";

function EffectView(props: ResultsViewProps): JSX.Element {
  return <Sections {...props} decorate={chanceBadge} />;
}

function WeatherView(props: ResultsViewProps): JSX.Element {
  return <Sections {...props} decorate={roleBadge} />;
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
