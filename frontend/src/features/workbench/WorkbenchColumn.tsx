import { type JSX, useId, useState } from "react";

import { isEmptyWorkbench } from "../../domain/workbench";
import { Button } from "../../ui/Button";
import { Bench } from "./Bench";
import { PartyDock } from "./PartyDock";
import { useWorkbench } from "./WorkbenchContext";

/**
 * The party and the bench beside the sky; on a narrow screen they fold behind a
 * button so the sky and the results keep the room.
 */
export function WorkbenchColumn({
  lowered,
}: {
  /** Leave room for what the header shows under the command field on the home page. */
  readonly lowered: boolean;
}): JSX.Element | null {
  const { workbench, pending } = useWorkbench();
  const [unfolded, setUnfolded] = useState(false);
  const contentId = useId();
  if (isEmptyWorkbench(workbench) && pending === null) return null;
  const open = unfolded || pending !== null;
  return (
    <div
      className={`scroll-area sm:w-sidebar pointer-events-none absolute bottom-3 left-3 z-30 w-[calc(100%-1.5rem)] space-y-2 sm:bottom-4 sm:left-4 sm:z-20 ${lowered ? "top-44 sm:top-32" : "top-32 sm:top-24"}`}
    >
      <div className="pointer-events-auto inline-flex sm:hidden">
        <Button
          variant="outline"
          size="small"
          aria-expanded={open}
          aria-controls={contentId}
          onPress={() => {
            setUnfolded(!unfolded);
          }}
        >
          Party {workbench.party.length} and bench {workbench.bench.length}
        </Button>
      </div>
      <div id={contentId} className={`space-y-3 ${open ? "" : "hidden sm:block"}`}>
        <PartyDock />
        <Bench />
      </div>
    </div>
  );
}
