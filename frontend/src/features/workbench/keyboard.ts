import { useEffect, useEffectEvent } from "react";

import { type WorkbenchApi } from "./WorkbenchContext";

export interface Shortcut {
  readonly keys: string;
  readonly action: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: "/", action: "Search" },
  { keys: "j and k", action: "Move to the next and the previous result" },
  { keys: "t", action: "Add the result to the party" },
  { keys: "c", action: "Compare the result on the bench" },
  { keys: "Ctrl+Z or Cmd+Z", action: "Undo the last change to the party or the bench" },
  { keys: "Shift+Ctrl+Z, Shift+Cmd+Z or Ctrl+Y", action: "Redo it" },
  { keys: "?", action: "List the keyboard shortcuts" },
  { keys: "Escape", action: "Close a dialog or keep the party as it is" },
];

const RESULT = "[data-result]";
const POKEMON = "pokemon:";

/** Text fields keep their own keys, Ctrl+Z included; dialogs keep theirs (SYS-UI-026). */
function ignored(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select") !== null ||
    target.closest('[role="dialog"]') !== null
  );
}

function travelled(event: KeyboardEvent, workbench: WorkbenchApi): boolean {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  const key = event.key.toLowerCase();
  if (key === "z" && !event.shiftKey) workbench.undo();
  else if (key === "z" || (key === "y" && event.ctrlKey)) workbench.redo();
  else return false;
  return true;
}

function currentResult(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active.closest<HTMLElement>(RESULT) : null;
}

function move(step: number): void {
  const results = [...document.querySelectorAll<HTMLElement>(RESULT)];
  const current = currentResult();
  const index = current === null ? -1 : results.indexOf(current);
  const next = index === -1 && step < 0 ? results.at(-1) : results[index + step];
  next?.focus();
  next?.scrollIntoView({ block: "nearest" });
}

function currentPokemon(): string | null {
  const key = currentResult()?.dataset["result"] ?? "";
  return key.startsWith(POKEMON) ? key.slice(POKEMON.length) : null;
}

function focusSearch(): void {
  document.querySelector<HTMLInputElement>('form[role="search"] input')?.focus();
}

function pressed(key: string, workbench: WorkbenchApi, onHelp: () => void): boolean {
  const pokemon = currentPokemon();
  const actions: Readonly<Record<string, () => void>> = {
    "/": focusSearch,
    j: () => {
      move(1);
    },
    k: () => {
      move(-1);
    },
    t: () => {
      if (pokemon !== null) workbench.add(pokemon);
    },
    c: () => {
      if (pokemon !== null) workbench.compare(pokemon);
    },
    "?": onHelp,
    Escape: workbench.cancelReplacement,
  };
  const action = actions[key];
  if (action === undefined || (key === "Escape" && workbench.pending === null)) return false;
  action();
  return true;
}

/** The keyboard shortcuts of the page, outside text fields and dialogs (SYS-UI-031). */
export function useShortcuts(workbench: WorkbenchApi, onHelp: () => void): void {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || ignored(event.target)) return;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey;
    if (travelled(event, workbench) || (plain && pressed(event.key, workbench, onHelp))) {
      event.preventDefault();
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
    };
  }, []);
}
