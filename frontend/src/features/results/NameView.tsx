import { type JSX, useId } from "react";

import { refKey, refOf } from "../../domain/entities";
import { HoloCard } from "../extras/HoloCard";
import { ResultCard } from "./ResultCard";
import { type ResultsViewProps, Sections } from "./Sections";

function BestMatch({ response, onOpen }: ResultsViewProps): JSX.Element | null {
  const headingId = useId();
  const best = response.best_match;
  if (best === null) return null;
  const result = response.sections
    .flatMap((section) => section.results)
    .find((candidate) => refKey(refOf(candidate)) === refKey(best));
  if (result === undefined) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-semibold">
        Best match
      </h2>
      {result.kind === "pokemon" ? (
        <HoloCard pokemon={result} onOpen={onOpen} />
      ) : (
        <ResultCard result={result} onOpen={onOpen} />
      )}
    </section>
  );
}

/** A name reading: the best match first, as a collectible card for a Pokémon. */
export function NameView(props: ResultsViewProps): JSX.Element {
  return (
    <>
      <BestMatch {...props} />
      <Sections {...props} />
    </>
  );
}
