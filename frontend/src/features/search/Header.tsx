import type { JSX, ReactNode } from "react";

import { Mark } from "../../ui/Mark";
import { DisplayPreferences } from "../motion/DisplayPreferences";
import { QueryGuide } from "./guide/QueryGuide";
import type { GuideSectionId } from "./guide/section";
import { SearchBox } from "./SearchBox";
import type { SearchController } from "./useSearchController";

function Wordmark(): JSX.Element {
  return (
    <h1 className="pointer-events-auto flex items-center gap-3 whitespace-nowrap">
      <Mark className="text-text size-9 shrink-0 sm:size-11" />
      <span className="flex items-baseline gap-2 sm:flex-col sm:gap-1">
        <span className="font-display text-[1.7rem] leading-none font-semibold tracking-tight sm:text-[2rem]">
          Pokédex
        </span>{" "}
        <span className="catalogue text-muted sr-only leading-none sm:not-sr-only">
          Constellation
        </span>
      </span>
    </h1>
  );
}

function Command(props: {
  readonly controller: SearchController;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <div className="order-last w-full min-w-0 sm:order-none sm:mx-auto sm:max-w-xl">
      <div className="command-bar group pointer-events-auto relative">
        <SearchBox controller={props.controller} />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transition-opacity group-focus-within:opacity-0"
        >
          /
        </kbd>
      </div>
      {props.children === undefined || props.children === null ? null : (
        <div className="pointer-events-auto mt-2 sm:mt-2.5">{props.children}</div>
      )}
    </div>
  );
}

function Tools(props: {
  readonly controller: SearchController;
  readonly guideOpen: boolean;
  readonly guideSection: GuideSectionId | null;
  readonly onGuideOpenChange: (open: boolean) => void;
}): JSX.Element {
  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-4 sm:pt-1">
      <QueryGuide
        open={props.guideOpen}
        section={props.guideSection}
        onOpenChange={props.onGuideOpenChange}
        onRun={props.controller.run}
      />
      <p className="catalogue text-muted hidden items-center gap-2 xl:flex">
        Shortcuts <kbd>?</kbd>
      </p>
      <span aria-hidden="true" className="bg-line hidden h-5 w-px sm:block" />
      <DisplayPreferences />
    </div>
  );
}

/**
 * The app bar: the atlas mark and wordmark, the command field with what the
 * page attaches under it, and the shortcuts hint.
 */
export function Header(props: {
  readonly controller: SearchController;
  readonly guideOpen: boolean;
  readonly guideSection: GuideSectionId | null;
  readonly onGuideOpenChange: (open: boolean) => void;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div aria-hidden="true" className="chart-edge h-2" />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 px-3 pt-2 pb-3 sm:flex-nowrap sm:items-start sm:gap-6 sm:px-5 sm:pt-3">
        <Wordmark />
        <Command controller={props.controller}>{props.children}</Command>
        <Tools {...props} />
      </div>
    </header>
  );
}
