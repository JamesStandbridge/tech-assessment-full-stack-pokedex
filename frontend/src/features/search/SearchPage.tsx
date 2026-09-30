import { type JSX, lazy, Suspense, useEffect, useState } from "react";

import type { EntityRef, SearchResponse } from "../../api/contract";
import { Spinner } from "../../ui/Spinner";
import { Home } from "../states/Home";
import { Announcer } from "../workbench/Announcer";
import { Shortcuts } from "../workbench/Shortcuts";
import { useWorkbench, WorkbenchProvider } from "../workbench/WorkbenchContext";
import { isEmptyWorkbench } from "../../domain/workbench";
import { Answer } from "./Answer";
import { useEscapeClears } from "./ClearSearch";
import { useQueryGuide } from "./guide/useQueryGuide";
import { useSearchResults } from "./queries";
import { Header } from "./Header";
import { type SearchController, useSearchController } from "./useSearchController";

const loadResultsRegion = () => import("../results/ResultsRegion");

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

/** The response the sky follows: none on the home page, the current one otherwise. */
function useShownResponse(query: string): SearchResponse | null {
  const search = useSearchResults(query);
  return query === "" ? null : (search.data ?? null);
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
          <WorkbenchColumn lowered={props.controller.query === ""} />
        </Suspense>
      ) : null}
    </>
  );
}

function Screen(): JSX.Element {
  const controller = useSearchController();
  const guide = useQueryGuide();
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
        <Header
          controller={controller}
          guideOpen={guide.open}
          guideSection={guide.section}
          onGuideOpenChange={guide.setOpen}
        >
          {hasQuery ? null : <Home onRun={controller.run} />}
        </Header>
        {hasQuery ? (
          <Answer controller={controller} onOpen={setOpened} onOpenGuide={guide.openGuide} />
        ) : null}
      </main>
      <Details opened={opened} onOpen={setOpened} />
      <Announcer />
      <Shortcuts
        onOpenGuide={() => {
          guide.openGuide(null);
        }}
      />
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
