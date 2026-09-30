import type { JSX } from "react";

import { Bench } from "./Bench";
import { PartyDock } from "./PartyDock";

/** The party and the bench beside the sky, or above it on a narrow screen. */
export function WorkbenchColumn(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-32 z-20 max-h-[calc(100dvh-9rem)] space-y-3 overflow-y-auto sm:top-24 sm:right-auto sm:left-4 sm:w-[26rem]">
      <PartyDock />
      <Bench />
    </div>
  );
}
