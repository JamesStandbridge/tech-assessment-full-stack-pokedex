import { type JSX, useId } from "react";

import type { EntityRef, SearchResponse, Section } from "../../api/contract";
import { kindLabel, refKey, refOf } from "../../domain/entities";
import { readingOf } from "../../domain/reading";
import { ResultCard } from "./ResultCard";

interface ResultsRegionProps {
  readonly response: SearchResponse;
  readonly outdated: boolean;
  readonly onOpen: (ref: EntityRef) => void;
}

function SectionView(props: {
  readonly section: Section;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const headingId = useId();
  const { section, onOpen } = props;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id={headingId} className="text-xl font-semibold">
          {kindLabel(section.kind, 2)}
        </h2>
        <p className="text-muted text-sm">
          {section.results.length} of {section.total}
        </p>
      </div>
      <ul className="grid gap-3">
        {section.results.map((result) => (
          <li key={refKey(refOf(result))}>
            <ResultCard result={result} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Every section of a response, in the order the API ranked the kinds. */
export function ResultsRegion({ response, outdated, onOpen }: ResultsRegionProps): JSX.Element {
  return (
    <section
      aria-label="Results"
      aria-busy={outdated}
      data-reading={readingOf(response)}
      className={`space-y-8 transition-opacity ${outdated ? "opacity-50" : "opacity-100"}`}
    >
      {response.sections.map((section) => (
        <SectionView key={section.kind} section={section} onOpen={onOpen} />
      ))}
    </section>
  );
}
