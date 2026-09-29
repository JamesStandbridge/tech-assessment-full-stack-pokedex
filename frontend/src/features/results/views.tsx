import { type ComponentType, type JSX, useId } from "react";

import type { EntityRef, SearchResponse } from "../../api/contract";
import { refKey } from "../../domain/entities";
import type { Reading } from "../../domain/reading";
import { comparedStats } from "../../domain/stats";
import { chanceBadge, comparisonBars, type Decoration, roleBadge } from "./decorations";
import { ResultCard } from "./ResultCard";
import { SectionView } from "./SectionView";

export interface ResultsViewProps {
  readonly response: SearchResponse;
  readonly onOpen: (ref: EntityRef) => void;
}

function Sections(props: ResultsViewProps & { readonly decorate?: Decoration }): JSX.Element {
  const { response, onOpen, decorate } = props;
  return (
    <>
      {response.sections.map((section) => (
        <SectionView
          key={`${response.query}:${section.kind}`}
          query={response.query}
          section={section}
          onOpen={onOpen}
          {...(decorate === undefined ? {} : { decorate })}
        />
      ))}
    </>
  );
}

function BestMatch({ response, onOpen }: ResultsViewProps): JSX.Element | null {
  const headingId = useId();
  const best = response.best_match;
  if (best === null) return null;
  const result = response.sections
    .flatMap((section) => section.results)
    .find((candidate) => refKey(candidate) === refKey(best));
  if (result === undefined) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-semibold">
        Best match
      </h2>
      <ResultCard result={result} onOpen={onOpen} />
    </section>
  );
}

function NameView(props: ResultsViewProps): JSX.Element {
  return (
    <>
      <BestMatch {...props} />
      <Sections {...props} />
    </>
  );
}

function CriteriaView(props: ResultsViewProps): JSX.Element {
  const stats = comparedStats(props.response.interpretation.alternatives[0]);
  return <Sections {...props} decorate={comparisonBars(stats)} />;
}

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
