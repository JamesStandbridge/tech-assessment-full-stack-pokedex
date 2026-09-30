/** A state reached by a change, with the words that announce the change. */
export interface Entry<T> {
  readonly state: T;
  readonly label: string;
}

/** Labelled past and future states around the present one (ADR 13). */
export interface History<T> {
  readonly past: readonly Entry<T>[];
  readonly present: Entry<T>;
  readonly future: readonly Entry<T>[];
}

export const HISTORY_LIMIT = 50;

export function historyOf<T>(state: T): History<T> {
  return { past: [], present: { state, label: "" }, future: [] };
}

/** Make a change the present; the oldest changes beyond the limit are forgotten, redo is lost. */
export function record<T>(history: History<T>, change: Entry<T>): History<T> {
  if (Object.is(change.state, history.present.state)) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: change,
    future: [],
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}
