import { type JSX, lazy, Suspense, useEffect, useState } from "react";

import { ApiError } from "../../api/errors";
import type { EntityRef } from "../../api/contract";
import { Spinner } from "../../ui/Spinner";
import { Home } from "../states/Home";
import { TeamProvider } from "../team/TeamContext";
import { TeamTray } from "../team/TeamTray";
import { EmptyOutcome, FailedSearch, InvalidQuery } from "../states/Outcomes";
import { Masthead } from "./Masthead";
import { useSearchResults } from "./queries";
import { SearchBox } from "./SearchBox";
import { Terms, Understanding } from "./Understanding";
import { type SearchController, useSearchController } from "./useSearchController";

const loadResultsRegion = () => import("../results/ResultsRegion");

const ResultsRegion = lazy(async () => {
  const module = await loadResultsRegion();
  return { default: module.ResultsRegion };
});

const EntityDialog = lazy(async () => {
  const module = await import("../details/EntityDialog");
  return { default: module.EntityDialog };
});

function Outcome(props: {
  readonly controller: SearchController;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element | null {
  const { controller, onOpen } = props;
  const search = useSearchResults(controller.query);
  if (controller.query === "") return <Home onRun={controller.run} />;
  if (search.isError) {
    const error = search.error;
    if (error instanceof ApiError && error.kind === "invalid") {
      return <InvalidQuery message={error.message} />;
    }
    return <FailedSearch message={error.message} onRetry={() => void search.refetch()} />;
  }
  const response = search.data;
  if (response === undefined) return <Spinner label="Searching…" />;
  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="min-w-0 space-y-6">
        <Terms response={response} />
        {search.isFetching ? <Spinner label="Searching…" /> : null}
        {response.outcome === "empty" ? (
          <EmptyOutcome response={response} onRun={controller.run} />
        ) : (
          <ResultsRegion response={response} outdated={search.isPlaceholderData} onOpen={onOpen} />
        )}
      </div>
      <aside
        aria-label="Notes on the query"
        className="lg:border-rule lg:col-start-2 lg:row-start-1 lg:border-l lg:pl-6"
      >
        <Understanding response={response} onRun={controller.run} />
      </aside>
    </div>
  );
}

/** The weather of the current reading sets the page ambience (SYS-UI-010). */
function useAmbience(query: string): string {
  const search = useSearchResults(query);
  const plan = search.data?.interpretation.alternatives[0];
  return plan?.weather?.weather ?? "none";
}

/** The whole search screen: the box, the outcome of the query in the URL, and the details. */
export function SearchPage(): JSX.Element {
  const controller = useSearchController();
  const [opened, setOpened] = useState<EntityRef | null>(null);
  const ambience = useAmbience(controller.query);
  const hasQuery = controller.query !== "";
  useEffect(() => {
    if (hasQuery) void loadResultsRegion();
  }, [hasQuery]);
  return (
    <TeamProvider>
      <div data-ambience={ambience} className="ambience min-h-dvh">
        <div className="mx-auto flex w-full max-w-[78rem] flex-col gap-8 px-5 pt-8 pb-40 sm:px-10">
          <Masthead />
          <SearchBox controller={controller} />
          <TeamTray />
          <main>
            <Outcome controller={controller} onOpen={setOpened} />
          </main>
          {opened === null ? null : (
            <Suspense fallback={<Spinner label="Loading the entry…" />}>
              <EntityDialog
                entity={opened}
                onOpen={setOpened}
                onClose={() => {
                  setOpened(null);
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    </TeamProvider>
  );
}
