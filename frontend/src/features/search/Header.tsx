import type { JSX } from "react";

import { Mark } from "../../ui/Mark";
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
        <span className="catalogue text-muted leading-none">Constellation</span>
      </span>
    </h1>
  );
}

/** The app bar: the atlas mark and wordmark, the command field and the shortcuts hint. */
export function Header({ controller }: { readonly controller: SearchController }): JSX.Element {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div aria-hidden="true" className="chart-edge h-2" />
      <div className="flex flex-col items-center gap-2.5 px-3 pt-2 pb-3 sm:flex-row sm:items-start sm:gap-6 sm:px-5 sm:pt-3">
        <Wordmark />
        <div className="command-bar group pointer-events-auto relative w-full max-w-xl sm:mx-auto">
          <SearchBox controller={controller} />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transition-opacity group-focus-within:opacity-0"
          >
            /
          </kbd>
        </div>
        <p className="catalogue text-muted hidden shrink-0 items-center gap-2 pt-3 xl:flex">
          Shortcuts <kbd>?</kbd>
        </p>
      </div>
    </header>
  );
}
