import { createContext, type JSX, type ReactNode, use, useState } from "react";

import { canRedo, canUndo, type History, record, redo, undo } from "../../domain/history";
import {
  applyAction,
  describeAction,
  PARTY_SIZE,
  type Workbench,
  type WorkbenchAction,
} from "../../domain/workbench";
import { usePersistedHistory } from "./persistence";

/** A change said out loud, with an undo action unless it is itself an undo or a redo. */
interface Notice {
  readonly id: number;
  readonly text: string;
  readonly undoable: boolean;
}

export interface WorkbenchApi {
  readonly workbench: Workbench;
  /** A Pokémon waiting for the member of a full party it replaces (SYS-UI-029). */
  readonly pending: string | null;
  readonly notice: Notice | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly add: (name: string) => void;
  readonly remove: (name: string) => void;
  readonly replace: (member: string, by: string) => void;
  readonly cancelReplacement: () => void;
  readonly clear: () => void;
  readonly compare: (name: string) => void;
  readonly uncompare: (name: string) => void;
  readonly pin: (name: string | null) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly dismiss: () => void;
}

const WorkbenchContext = createContext<WorkbenchApi | null>(null);

interface Travel {
  readonly history: History<Workbench>;
  readonly go: (move: (history: History<Workbench>) => History<Workbench>, text: string) => void;
}

function travels({ history, go }: Travel): Pick<WorkbenchApi, "undo" | "redo"> {
  return {
    undo: () => {
      if (canUndo(history)) go(undo, `Undone: ${history.present.label}`);
    },
    redo: () => {
      const next = history.future[0];
      if (next !== undefined) go(redo, `Redone: ${next.label}`);
    },
  };
}

type Act = (action: WorkbenchAction) => void;

type PartyIntents = Pick<
  WorkbenchApi,
  "add" | "remove" | "replace" | "cancelReplacement" | "clear"
>;

function partyIntents(parts: {
  readonly workbench: Workbench;
  readonly act: Act;
  readonly setPending: (name: string | null) => void;
}): PartyIntents {
  const { workbench, act, setPending } = parts;
  const full = workbench.party.length >= PARTY_SIZE;
  return {
    add: (name) => {
      if (full && !workbench.party.includes(name)) setPending(name);
      else act({ type: "add", name });
    },
    remove: (name) => {
      act({ type: "remove", name });
    },
    replace: (member, by) => {
      setPending(null);
      act({ type: "replace", member, by });
    },
    cancelReplacement: () => {
      setPending(null);
    },
    clear: () => {
      act({ type: "clear" });
    },
  };
}

function benchIntents(act: Act): Pick<WorkbenchApi, "compare" | "uncompare" | "pin"> {
  return {
    compare: (name) => {
      act({ type: "compare", name });
    },
    uncompare: (name) => {
      act({ type: "uncompare", name });
    },
    pin: (name) => {
      act({ type: "pin", name });
    },
  };
}

function useWorkbenchState(): WorkbenchApi {
  const { history, setHistory } = usePersistedHistory();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const workbench = history.present.state;
  const say = (text: string, undoable: boolean): void => {
    setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, text, undoable }));
  };
  const act: Act = (action) => {
    if (applyAction(workbench, action) === workbench) return;
    const label = describeAction(action);
    setHistory((current) =>
      record(current, { state: applyAction(current.present.state, action), label }),
    );
    say(label, true);
  };
  const go: Travel["go"] = (move, text) => {
    setHistory(move);
    say(text, false);
  };
  return {
    workbench,
    pending,
    notice,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    ...partyIntents({ workbench, act, setPending }),
    ...benchIntents(act),
    ...travels({ history, go }),
    dismiss: () => {
      setNotice(null);
    },
  };
}

/** The party and the bench, kept across searches with their undo history (ADR 13). */
export function WorkbenchProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  return <WorkbenchContext value={useWorkbenchState()}>{children}</WorkbenchContext>;
}

export function useWorkbench(): WorkbenchApi {
  const workbench = use(WorkbenchContext);
  if (workbench === null) throw new Error("useWorkbench must be used inside a WorkbenchProvider.");
  return workbench;
}
