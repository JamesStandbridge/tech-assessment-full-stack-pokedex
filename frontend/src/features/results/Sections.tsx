import type { JSX } from "react";

import type { EntityRef, SearchResponse, Term } from "../../api/contract";
import type { Decoration } from "./decorations";
import { SectionView } from "./SectionView";

export interface ResultsViewProps {
  readonly response: SearchResponse;
  readonly onOpen: (ref: EntityRef) => void;
}

const EMPHASISED: ReadonlySet<Term["role"]> = new Set([
  "name",
  "type",
  "characteristic",
  "stat",
  "effect",
  "weather",
  "relation",
]);

/** The words of the query that the reasons of a result echo, to emphasise there. */
export function emphasisOf(response: SearchResponse): readonly string[] {
  return response.terms.filter((term) => EMPHASISED.has(term.role)).map((term) => term.text);
}

/** Every section of a response, each result decorated by the view. */
export function Sections(
  props: ResultsViewProps & { readonly decorate?: Decoration },
): JSX.Element {
  const { response, onOpen, decorate } = props;
  const emphasis = emphasisOf(response);
  return (
    <>
      {response.sections.map((section) => (
        <SectionView
          key={`${response.query}:${section.kind}`}
          query={response.query}
          section={section}
          onOpen={onOpen}
          emphasis={emphasis}
          {...(decorate === undefined ? {} : { decorate })}
        />
      ))}
    </>
  );
}
