import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import { type History, historyOf } from "../../domain/history";
import {
  EMPTY_WORKBENCH,
  parseWorkbench,
  sanitizedWorkbench,
  type Workbench,
} from "../../domain/workbench";

const ADDRESS = {
  party: parseAsArrayOf(parseAsString),
  compare: parseAsArrayOf(parseAsString),
  ref: parseAsString,
};

const STORAGE_KEY = "pokedex:workbench";

interface Address {
  readonly party: string[] | null;
  readonly compare: string[] | null;
  readonly ref: string | null;
}

function fromAddress(address: Address): Workbench | null {
  if (address.party === null && address.compare === null) return null;
  return sanitizedWorkbench({
    party: address.party ?? [],
    bench: address.compare ?? [],
    reference: address.ref,
  });
}

function addressOf(workbench: Workbench): Address {
  return {
    party: workbench.party.length === 0 ? null : [...workbench.party],
    compare: workbench.bench.length === 0 ? null : [...workbench.bench],
    ref: workbench.reference,
  };
}

/** Local storage may be refused, as in private windows; the workbench then lives in the page only. */
function stored(): Workbench | null {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text === null ? null : parseWorkbench(text);
  } catch (error) {
    if (error instanceof DOMException) return null;
    throw error;
  }
}

function store(workbench: Workbench): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workbench));
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

export interface PersistedHistory {
  readonly history: History<Workbench>;
  readonly setHistory: Dispatch<SetStateAction<History<Workbench>>>;
}

/**
 * The workbench history, started from the address, else from the device (SYS-UI-030).
 * Changes replace the address rather than push to it, so Back still walks the searches.
 */
export function usePersistedHistory(): PersistedHistory {
  const [address, setAddress] = useQueryStates(ADDRESS, { history: "replace" });
  const [history, setHistory] = useState(() =>
    historyOf(fromAddress(address) ?? stored() ?? EMPTY_WORKBENCH),
  );
  const workbench = history.present.state;
  useEffect(() => {
    void setAddress(addressOf(workbench));
    store(workbench);
  }, [workbench, setAddress]);
  return { history, setHistory };
}
