import { type JSX, useState } from "react";

import { Dialog } from "../../ui/Dialog";
import { SHORTCUTS, useShortcuts } from "./keyboard";
import { useWorkbench } from "./WorkbenchContext";

/** Listens to the keyboard shortcuts and lists them on "?". */
export function Shortcuts(): JSX.Element {
  const [open, setOpen] = useState(false);
  useShortcuts(useWorkbench(), () => {
    setOpen(true);
  });
  return (
    <Dialog
      title="Keyboard shortcuts"
      isOpen={open}
      onClose={() => {
        setOpen(false);
      }}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys} className="contents">
            <dt>
              <kbd className="border-line rounded border px-1.5 py-0.5 font-mono text-xs">
                {shortcut.keys}
              </kbd>
            </dt>
            <dd className="text-muted">{shortcut.action}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
