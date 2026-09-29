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
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-semibold">
          {label}
        </h2>
        <p className="text-muted text-sm">
          {pages.results.length} of {pages.total}
        </p>
      </div>
      <ul className="grid gap-3">
        {pages.results.map((result) => (
          <li key={refKey(refOf(result))}>
            <ResultCard result={result} onOpen={onOpen}>
              {decorate?.(result, pages.results)}
            </ResultCard>
          </li>
        ))}
      </ul>
      {pages.hasMore ? (
        <Button variant="outline" isDisabled={pages.loadingMore} onPress={pages.loadMore}>
          {pages.loadingMore ? "Loading…" : `Show more ${label}`}
        </Button>
      ) : null}
    </section>
  );
}
