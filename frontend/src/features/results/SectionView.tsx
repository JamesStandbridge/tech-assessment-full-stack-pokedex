import { type JSX, useId } from "react";

import type { EntityRef, Section } from "../../api/contract";
import { kindLabel, refKey, refOf } from "../../domain/entities";
import { Button } from "../../ui/Button";
import type { Decoration } from "./decorations";
import { ResultCard } from "./ResultCard";
import { useSectionPages } from "./useSectionPages";

interface SectionViewProps {
  readonly query: string;
  readonly section: Section;
  readonly onOpen: (ref: EntityRef) => void;
  readonly decorate?: Decoration;
}

/** One ranked section, with more results appended on request. */
export function SectionView({ query, section, onOpen, decorate }: SectionViewProps): JSX.Element {
  const headingId = useId();
  const pages = useSectionPages(query, section);
  const label = kindLabel(section.kind, 2);
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="border-rule flex items-baseline gap-3 border-b pb-1.5">
        <h2 id={headingId} className="font-display text-2xl font-semibold">
          {label}
        </h2>
        <span aria-hidden="true" className="leader flex-1" />
        <p className="catalogue text-muted tabular-nums">
          {pages.results.length} of {pages.total}
        </p>
      </div>
      <ul className="divide-line -mt-1 divide-y">
        {pages.results.map((result) => (
          <li key={refKey(refOf(result))}>
            <ResultCard result={result} onOpen={onOpen}>
              {decorate?.(result, pages.results)}
            </ResultCard>
          </li>
        ))}
      </ul>
      {pages.hasMore ? (
        <Button
          variant="outline"
          size="small"
          isDisabled={pages.loadingMore}
          onPress={pages.loadMore}
        >
          {pages.loadingMore ? "Loading…" : `Show more ${label}`}
        </Button>
      ) : null}
    </section>
  );
}
