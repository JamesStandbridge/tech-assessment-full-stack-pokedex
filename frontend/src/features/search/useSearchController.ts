import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";

const PAUSE_MS = 300;
export const MIN_QUERY_LENGTH = 2;

export interface SearchController {
  /** Text of the search box. */
  readonly input: string;
  /** Query in the page URL, the one whose results are shown. */
  readonly query: string;
  /** The user typed since the last deliberate search, so suggestions are relevant. */
  readonly typing: boolean;
  readonly type: (value: string) => void;
  /** Run the text of the search box at once, as a new history entry. */
  readonly submit: () => void;
  /** Run a query given by the interface, such as an example or a refinement. */
  readonly run: (query: string) => void;
}

interface PauseTimer {
  readonly schedule: (action: () => void) => void;
  readonly cancel: () => void;
}

/** A timer restarted by every keystroke and cleared when the component unmounts. */
function usePauseTimer(): PauseTimer {
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );
  const cancel = (): void => {
    window.clearTimeout(timerRef.current);
  };
  const schedule = (action: () => void): void => {
    cancel();
    timerRef.current = window.setTimeout(action, PAUSE_MS);
  };
  return { schedule, cancel };
}

/** Run a state update, during render, whenever the URL query changes, as by going back. */
function useFollowUrl(query: string, onChange: () => void): void {
  const [followed, setFollowed] = useState(query);
  if (query !== followed) {
    setFollowed(query);
    onChange();
  }
}

/**
 * Keep the query in the URL (SYS-UI-007): a pause in typing replaces the history
 * entry, a deliberate search pushes a new one (ADR 10).
 */
export function useSearchController(): SearchController {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [input, setInput] = useState(query);
  const [typing, setTyping] = useState(false);
  const timer = usePauseTimer();
  useFollowUrl(query, () => {
    if (query !== input.trim()) {
      setInput(query);
      setTyping(false);
    }
  });
  const commit = (value: string, history: "push" | "replace"): void => {
    const trimmed = value.trim();
    void setQuery(trimmed === "" ? null : trimmed, { history });
  };
  const type = (value: string): void => {
    setInput(value);
    setTyping(true);
    timer.schedule(() => {
      if (value.trim().length >= MIN_QUERY_LENGTH || value.trim() === "") commit(value, "replace");
    });
  };
  const run = (value: string): void => {
    timer.cancel();
    setInput(value);
    setTyping(false);
    commit(value, "push");
  };
  return {
    input,
    query,
    typing,
    type,
    run,
    submit: () => {
      run(input);
    },
  };
}
