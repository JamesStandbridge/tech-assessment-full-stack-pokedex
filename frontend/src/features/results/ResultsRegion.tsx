import type { JSX } from "react";

import type { EntityRef, SearchResponse } from "../../api/contract";
import { readingOf } from "../../domain/reading";
import { RESULT_VIEWS } from "./views";

interface ResultsRegionProps {
  readonly response: SearchResponse;
  readonly outdated: boolean;
  readonly onOpen: (ref: EntityRef) => void;
}

/** The results, in the view suited to the reading of the query (SYS-UI-008). */
export function ResultsRegion({ response, outdated, onOpen }: ResultsRegionProps): JSX.Element {
  const reading = readingOf(response);
  const View = RESULT_VIEWS[reading];
  return (
    <section
      aria-label="Results"
      aria-busy={outdated}
      data-reading={reading}
      className={`space-y-8 transition-opacity ${outdated ? "opacity-50" : "opacity-100"}`}
    >
      <View response={response} onOpen={onOpen} />
    </section>
  );
}
