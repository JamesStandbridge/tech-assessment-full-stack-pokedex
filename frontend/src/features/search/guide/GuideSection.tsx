import type { JSX } from "react";

import type { GuideSectionContent, QueryGuideContent } from "./content";
import { GuideExamples } from "./GuideExamples";
import { GuideMisses } from "./GuideMisses";

export function GuideSectionView(props: {
  readonly section: GuideSectionContent;
  readonly checks: QueryGuideContent["checks"];
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const { section, checks, onRun } = props;
  return (
    <section aria-labelledby={`guide-${section.id}`} className="space-y-3">
      <div>
        <h3
          id={`guide-${section.id}`}
          tabIndex={-1}
          className="font-display text-2xl leading-tight font-semibold outline-none"
        >
          {section.title}
        </h3>
        <p className="text-muted mt-1 text-sm">{section.lead}</p>
        <p className="catalogue text-accent mt-2">{section.pattern}</p>
      </div>
      <GuideExamples
        title={section.title}
        examples={section.examples}
        checks={checks}
        onRun={onRun}
      />
      <GuideMisses misses={section.misses} onRun={onRun} />
    </section>
  );
}
