import { type JSX, useEffect, useEffectEvent, useRef } from "react";

import { Button } from "../../ui/Button";
import { useHeld } from "./useHeld";
import { useWorkbench } from "./WorkbenchContext";

const SHOWN_MS = 8000;

/**
 * Every change to the workbench is announced politely with an Undo action (SYS-UI-027);
 * the announcement stays while it has the pointer or the focus.
 */
export function Announcer(): JSX.Element {
  const { notice, undo, dismiss } = useWorkbench();
  const regionRef = useRef<HTMLDivElement>(null);
  const held = useHeld(regionRef);
  const expire = useEffectEvent(() => {
    dismiss();
  });
  useEffect(() => {
    if (notice === null || held) return;
    const timer = window.setTimeout(expire, SHOWN_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [notice, held]);
  return (
    <div
      ref={regionRef}
      role="status"
      aria-label="Workbench changes"
      className="pointer-events-auto fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
    >
      {notice === null ? null : (
        <div
          key={notice.id}
          className="panel flex items-center gap-3 rounded-full py-1 pr-1 pl-4 text-sm whitespace-nowrap"
        >
          <span>{notice.text}</span>
          {notice.undoable ? (
            <Button variant="outline" onPress={undo}>
              Undo
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
