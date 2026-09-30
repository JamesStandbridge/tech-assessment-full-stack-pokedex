import { assertNever } from "./assertNever";
import { displayName } from "./entities";

export const PARTY_SIZE = 6;
export const BENCH_SIZE = 4;

/** The party and the bench, as dataset names of Pokémon (ADR 13). */
export interface Workbench {
  readonly party: readonly string[];
  readonly bench: readonly string[];
  /** The bench member the others are measured against. */
  readonly reference: string | null;
}

export const EMPTY_WORKBENCH: Workbench = { party: [], bench: [], reference: null };

export type WorkbenchAction =
  | { readonly type: "add"; readonly name: string }
  | { readonly type: "remove"; readonly name: string }
  | { readonly type: "replace"; readonly member: string; readonly by: string }
  | { readonly type: "clear" }
  | { readonly type: "compare"; readonly name: string }
  | { readonly type: "uncompare"; readonly name: string }
  | { readonly type: "pin"; readonly name: string | null };

function added(list: readonly string[], name: string, size: number): readonly string[] | null {
  return list.length >= size || list.includes(name) ? null : [...list, name];
}

function removed(list: readonly string[], name: string): readonly string[] | null {
  return list.includes(name) ? list.filter((other) => other !== name) : null;
}

function withParty(workbench: Workbench, party: readonly string[] | null): Workbench {
  return party === null ? workbench : { ...workbench, party };
}

function replaced(workbench: Workbench, member: string, by: string): Workbench {
  if (!workbench.party.includes(member) || workbench.party.includes(by)) return workbench;
  return { ...workbench, party: workbench.party.map((name) => (name === member ? by : name)) };
}

function uncompared(workbench: Workbench, name: string): Workbench {
  const bench = removed(workbench.bench, name);
  if (bench === null) return workbench;
  return {
    ...workbench,
    bench,
    reference: workbench.reference === name ? null : workbench.reference,
  };
}

function pinned(workbench: Workbench, name: string | null): Workbench {
  if (name === workbench.reference || (name !== null && !workbench.bench.includes(name))) {
    return workbench;
  }
  return { ...workbench, reference: name };
}

/** The workbench after an action; the same object when the action changes nothing. */
export function applyAction(workbench: Workbench, action: WorkbenchAction): Workbench {
  switch (action.type) {
    case "add":
      return withParty(workbench, added(workbench.party, action.name, PARTY_SIZE));
    case "remove":
      return withParty(workbench, removed(workbench.party, action.name));
    case "replace":
      return replaced(workbench, action.member, action.by);
    case "clear":
      return workbench.party.length === 0 ? workbench : { ...workbench, party: [] };
    case "compare": {
      const bench = added(workbench.bench, action.name, BENCH_SIZE);
      return bench === null ? workbench : { ...workbench, bench };
    }
    case "uncompare":
      return uncompared(workbench, action.name);
    case "pin":
      return pinned(workbench, action.name);
    default:
      return assertNever(action);
  }
}

/** The words that announce an action once it is done (SYS-UI-027). */
export function describeAction(action: WorkbenchAction): string {
  switch (action.type) {
    case "add":
      return `Added ${displayName(action.name)} to the party`;
    case "remove":
      return `Removed ${displayName(action.name)}`;
    case "replace":
      return `Replaced ${displayName(action.member)} with ${displayName(action.by)}`;
    case "clear":
      return "Cleared the party";
    case "compare":
      return `Compared ${displayName(action.name)}`;
    case "uncompare":
      return `Stopped comparing ${displayName(action.name)}`;
    case "pin":
      return action.name === null
        ? "Unpinned the reference"
        : `Pinned ${displayName(action.name)} as the reference`;
    default:
      return assertNever(action);
  }
}

const NAME = /^[a-z0-9-]{1,40}$/;

function validNames(names: readonly unknown[], size: number): readonly string[] {
  const valid = names.filter((name): name is string => typeof name === "string" && NAME.test(name));
  return [...new Set(valid)].slice(0, size);
}

/** A workbench read from outside, such as an address: only well-formed names within the limits. */
export function sanitizedWorkbench(raw: {
  readonly party: readonly unknown[];
  readonly bench: readonly unknown[];
  readonly reference: unknown;
}): Workbench {
  const bench = validNames(raw.bench, BENCH_SIZE);
  const reference =
    typeof raw.reference === "string" && bench.includes(raw.reference) ? raw.reference : null;
  return { party: validNames(raw.party, PARTY_SIZE), bench, reference };
}

export function isEmptyWorkbench(workbench: Workbench): boolean {
  return workbench.party.length === 0 && workbench.bench.length === 0;
}

function listOf(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/** A workbench saved as JSON, or null when the text is not one. */
export function parseWorkbench(text: string): Workbench | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
  if (typeof value !== "object" || value === null) return null;
  const record: Readonly<Record<string, unknown>> = { ...value };
  return sanitizedWorkbench({
    party: listOf(record["party"]),
    bench: listOf(record["bench"]),
    reference: record["reference"],
  });
}
