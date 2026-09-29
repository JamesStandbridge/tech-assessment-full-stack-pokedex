import type { JSX } from "react";

import type { EntityRef, SearchResponse } from "../../api/contract";
import type { Decoration } from "./decorations";
import { SectionView } from "./SectionView";

export interface ResultsViewProps {
  readonly response: SearchResponse;
  readonly onOpen: (ref: EntityRef) => void;
}

/** Every section of a response, each result decorated by the view. */
export function Sections(
  props: ResultsViewProps & { readonly decorate?: Decoration },
): JSX.Element {
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
