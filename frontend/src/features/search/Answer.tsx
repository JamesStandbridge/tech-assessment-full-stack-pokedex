import { type JSX, lazy } from "react";

import { ApiError } from "../../api/errors";
import type { EntityRef, SearchResponse } from "../../api/contract";
import { Panel } from "../../ui/Panel";
import { Spinner } from "../../ui/Spinner";
import { EmptyOutcome, FailedSearch, InvalidQuery } from "../states/Outcomes";
import { ClearSearch } from "./ClearSearch";
import { guideLinkLabel, type GuideSectionId, guideSection } from "./guide/section";
import { useSearchResults } from "./queries";
import { Understanding } from "./Understanding";
import type { SearchController } from "./useSearchController";

const ResultsRegion = lazy(async () => {
  const module = await import("../results/ResultsRegion");
  return { default: module.ResultsRegion };
});

function Outcome(props: {
  readonly controller: SearchController;
  readonly onOpen: (ref: EntityRef) => void;
  readonly onOpenGuide: (section: GuideSectionId | null) => void;
}): JSX.Element | null {
  const { controller, onOpen, onOpenGuide } = props;
  const search = useSearchResults(controller.query);
  if (search.isError)
    return <SearchFailure error={search.error} onRetry={() => void search.refetch()} />;
  const response = search.data;
  return (
    <div className="space-y-6">
      {search.isFetching ? <Spinner label="Searching…" /> : null}
      {response === undefined ? null : (
        <>
          <Understanding response={response} onRun={controller.run} onOpenGuide={onOpenGuide} />
          {response.outcome === "empty" ? (
            <EmptyGuide response={response} onRun={controller.run} onOpenGuide={onOpenGuide} />
          ) : (
            <ResultsRegion
              response={response}
              outdated={search.isPlaceholderData}
              onOpen={onOpen}
            />
          )}
        </>
      )}
    </div>
  );
}

function SearchFailure(props: {
  readonly error: Error;
  readonly onRetry: () => void;
}): JSX.Element {
  if (props.error instanceof ApiError && props.error.kind === "invalid") {
    return <InvalidQuery message={props.error.message} />;
  }
  return <FailedSearch message={props.error.message} onRetry={props.onRetry} />;
}

function EmptyGuide(props: {
  readonly response: SearchResponse;
  readonly onRun: (query: string) => void;
  readonly onOpenGuide: (section: GuideSectionId | null) => void;
}): JSX.Element {
  const section = guideSection(props.response);
  return (
    <EmptyOutcome
      response={props.response}
      onRun={props.onRun}
      guideLabel={guideLinkLabel(section)}
      onOpenGuide={() => {
        props.onOpenGuide(section);
      }}
    />
  );
}

/** The answer plate: how the query was read, or why it found nothing. */
export function Answer(props: {
  readonly controller: SearchController;
  readonly onOpen: (ref: EntityRef) => void;
  readonly onOpenGuide: (section: GuideSectionId | null) => void;
}): JSX.Element {
  return (
    <Panel
      label="Answer"
      eyebrow="Answer"
      title={props.controller.query}
      actions={<ClearSearch controller={props.controller} />}
      scrolls
      className="motion-safe:animate-rise sm:w-sidebar absolute right-0 bottom-0 left-0 z-20 max-h-[62dvh] sm:top-24 sm:right-4 sm:bottom-4 sm:left-auto sm:max-h-none"
    >
      <Outcome {...props} />
    </Panel>
  );
}
