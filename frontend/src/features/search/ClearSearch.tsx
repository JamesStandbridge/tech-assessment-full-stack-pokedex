import { type JSX, useEffect, useEffectEvent } from "react";

import { Button } from "../../ui/Button";
import { focusSearch, ignored } from "../workbench/keyboard";
import { useWorkbench } from "../workbench/WorkbenchContext";
import type { SearchController } from "./useSearchController";

/** Back to the home sky, with the focus in the search box for the next question (SYS-UI-034). */
function clearSearch(controller: SearchController): void {
  controller.clear();
  focusSearch();
}

/** An Escape without modifiers that no text field, dialog or earlier listener took. */
function freeEscape(event: KeyboardEvent): boolean {
  if (event.key !== "Escape" || event.defaultPrevented || ignored(event.target)) return false;
  return !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey);
}

/**
 * Escape outside text fields and dialogs clears the search, unless the party is
 * waiting for a replacement, which Escape declines first (SYS-UI-029).
 */
export function useEscapeClears(controller: SearchController): void {
  const workbench = useWorkbench();
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (!freeEscape(event) || workbench.pending !== null) return;
    if (controller.query === "" && controller.input === "") return;
    event.preventDefault();
    clearSearch(controller);
  });
  useEffect(() => {
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
    };
  }, []);
}

/** The control that closes the answer and gives the whole sky back to exploration. */
export function ClearSearch({
  controller,
}: {
  readonly controller: SearchController;
}): JSX.Element {
  return (
    <Button
      variant="outline"
      size="small"
      onPress={() => {
        clearSearch(controller);
      }}
    >
      Clear search
      <kbd aria-hidden="true" className="text-text">
        Esc
      </kbd>
    </Button>
  );
}
