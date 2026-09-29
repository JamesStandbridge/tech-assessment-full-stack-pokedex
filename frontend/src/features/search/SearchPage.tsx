import { type JSX, lazy, Suspense, useState } from "react";

import { ApiError } from "../../api/errors";
import type { EntityRef } from "../../api/contract";
import { Spinner } from "../../ui/Spinner";
import { Home } from "../states/Home";
import { EmptyOutcome, FailedSearch, InvalidQuery } from "../states/Outcomes";
import { useSearchResults } from "./queries";
import { SearchBox } from "./SearchBox";
import { Understanding } from "./Understanding";
import { type SearchController, useSearchController } from "./useSearchController";

const ResultsRegion = lazy(async () => {
  const module = await import("../results/ResultsRegion");
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
  return (
    <div className="space-y-6">
      {search.isFetching ? <Spinner label="Searching…" /> : null}
      {response === undefined ? null : (
        <>
          <Understanding response={response} onRun={controller.run} />
          {response.outcome === "empty" ? (
            <EmptyOutcome response={response} onRun={controller.run} />
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
  return (
    <div data-ambience={ambience} className="ambience min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <header className="space-y-5">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-accent">Pokédex</span> Search
          </h1>
          <SearchBox controller={controller} />
        </header>
        <Outcome controller={controller} onOpen={setOpened} />
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
      </main>
    </div>
  );
}
