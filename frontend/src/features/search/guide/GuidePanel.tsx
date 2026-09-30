import { type JSX, useEffect } from "react";
import { Dialog as AriaDialog, Heading } from "react-aria-components";

import { Button } from "../../../ui/Button";
import { loadGuide } from "./content";
import { GuideSectionView } from "./GuideSection";
import { GuideTips } from "./GuideTips";
import type { GuideSectionId } from "./section";

function GuideHeader(): JSX.Element {
  return (
    <div className="border-line flex items-start justify-between gap-4 border-b px-4 pt-4 pb-3 sm:px-5">
      <div className="min-w-0">
        <p className="catalogue text-accent mb-1">Query guide</p>
        <Heading slot="title" className="font-display text-3xl leading-none font-semibold">
          How to ask
        </Heading>
      </div>
      <Button slot="close" variant="outline" size="small">
        Close
        <kbd aria-hidden="true">Esc</kbd>
      </Button>
    </div>
  );
}

function useFocusedSection(section: GuideSectionId | null): void {
  useEffect(() => {
    if (section === null) return;
    const heading = document.getElementById(`guide-${section}`);
    if (!(heading instanceof HTMLElement)) return;
    heading.focus();
    heading.scrollIntoView({ block: "nearest" });
  }, [section]);
}

/** The guide body, loaded apart from the first paint so the search page stays small. */
export function GuidePanel(props: {
  readonly section: GuideSectionId | null;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const guide = loadGuide();
  useFocusedSection(props.section);
  return (
    <AriaDialog
      aria-label="How to ask"
      className="flex max-h-[inherit] min-h-0 flex-col outline-none"
    >
      <GuideHeader />
      <div className="scroll-area min-h-0 flex-1 px-4 py-4 sm:px-5">
        <div className="space-y-6">
          {guide.sections.map((section) => (
            <GuideSectionView
              key={section.id}
              section={section}
              checks={guide.checks}
              onRun={props.onRun}
            />
          ))}
          <GuideTips tips={guide.tips} onRun={props.onRun} />
        </div>
      </div>
    </AriaDialog>
  );
}
