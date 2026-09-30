import { type JSX, lazy, Suspense, useEffect, useState } from "react";

import { ApiError } from "../../api/errors";
import type { EntityRef, SearchResponse } from "../../api/contract";
import { Spinner } from "../../ui/Spinner";
import { Home } from "../states/Home";
import { Announcer } from "../workbench/Announcer";
import { Shortcuts } from "../workbench/Shortcuts";
import { useWorkbench, WorkbenchProvider } from "../workbench/WorkbenchContext";
import { EmptyOutcome, FailedSearch, InvalidQuery } from "../states/Outcomes";
import { isEmptyWorkbench } from "../../domain/workbench";
import { ClearSearch, useEscapeClears } from "./ClearSearch";
import { useSearchResults } from "./queries";
import { Header } from "./Header";
import { Understanding } from "./Understanding";
import { type SearchController, useSearchController } from "./useSearchController";

const loadResultsRegion = () => import("../results/ResultsRegion");

const ResultsRegion = lazy(async () => {
  const module = await loadResultsRegion();
  return { default: module.ResultsRegion };
});

const Constellation = lazy(async () => {
  const module = await import("../scene/Constellation");
  return { default: module.Constellation };
});

const WorkbenchColumn = lazy(async () => {
  const module = await import("../workbench/WorkbenchColumn");
  return { default: module.WorkbenchColumn };
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

/** The response the sky follows: none on the home page, the current one otherwise. */
function useShownResponse(query: string): SearchResponse | null {
  const search = useSearchResults(query);
  return query === "" ? null : (search.data ?? null);
}

function Panel(props: {
  readonly controller: SearchController;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  return (
    <div className="plate motion-safe:animate-rise pointer-events-auto absolute right-0 bottom-0 left-0 z-20 max-h-[58dvh] overflow-y-auto p-4 sm:top-24 sm:right-4 sm:bottom-4 sm:left-auto sm:max-h-none sm:w-[26rem] sm:p-5">
      <div className="mb-4 flex justify-end">
        <ClearSearch controller={props.controller} />
      </div>
      <Outcome {...props} />
    </div>
  );
}

function Details(props: {
  readonly opened: EntityRef | null;
  readonly onOpen: (ref: EntityRef | null) => void;
}): JSX.Element | null {
  const { opened, onOpen } = props;
  if (opened === null) return null;
  return (
    <Suspense fallback={<Spinner label="Loading the entry…" />}>
      <EntityDialog
        entity={opened}
        onOpen={onOpen}
        onClose={() => {
          onOpen(null);
        }}
      />
    </Suspense>
  );
}

/** The sky, loaded beside the page, and the workbench column once it holds anything. */
function Backdrop(props: {
  readonly response: SearchResponse | null;
  readonly controller: SearchController;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const workbench = useWorkbench();
  const docked = !isEmptyWorkbench(workbench.workbench) || workbench.pending !== null;
  return (
    <>
      <Suspense fallback={null}>
        <Constellation
          response={props.response}
          panel={props.controller.query !== ""}
          workbench={docked}
          onOpen={props.onOpen}
          onRun={props.controller.run}
        />
      </Suspense>
      {docked ? (
        <Suspense fallback={null}>
          <WorkbenchColumn />
        </Suspense>
      ) : null}
    </>
  );
}

function Screen(): JSX.Element {
  const controller = useSearchController();
  const [opened, setOpened] = useState<EntityRef | null>(null);
  const response = useShownResponse(controller.query);
  const ambience = response?.interpretation.alternatives[0]?.weather?.weather ?? "none";
  const hasQuery = controller.query !== "";
  useEscapeClears(controller);
  useEffect(() => {
    if (hasQuery) void loadResultsRegion();
  }, [hasQuery]);
  return (
    <div data-ambience={ambience} className="ambience relative h-dvh overflow-hidden">
      <main className="contents">
        <Backdrop response={response} controller={controller} onOpen={setOpened} />
        <Header controller={controller} />
        {hasQuery ? (
          <Panel controller={controller} onOpen={setOpened} />
        ) : (
          <Home onRun={controller.run} />
        )}
      </main>
      <Details opened={opened} onOpen={setOpened} />
      <Announcer />
      <Shortcuts />
    </div>
  );
}

/** The whole search screen: the sky of species, the command bar over it, and the answer beside it. */
export function SearchPage(): JSX.Element {
  return (
    <WorkbenchProvider>
      <Screen />
    </WorkbenchProvider>
  );
}
