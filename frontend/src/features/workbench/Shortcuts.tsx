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
      eyebrow="Reference"
      isOpen={open}
      onClose={() => {
        setOpen(false);
      }}
    >
      <dl className="divide-line grid grid-cols-[auto_1fr] divide-y text-sm">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys} className="col-span-2 grid grid-cols-subgrid gap-x-6 py-2">
            <dt>
              <kbd>{shortcut.keys}</kbd>
            </dt>
            <dd className="text-muted">{shortcut.action}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
