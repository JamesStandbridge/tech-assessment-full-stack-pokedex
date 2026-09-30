import { expect, test } from "vitest";

import {
  applyAction,
  BENCH_SIZE,
  describeAction,
  EMPTY_WORKBENCH,
  isEmptyWorkbench,
  PARTY_SIZE,
  parseWorkbench,
  sanitizedWorkbench,
  type Workbench,
  type WorkbenchAction,
} from "./workbench";

function applied(actions: readonly WorkbenchAction[]): Workbench {
  return actions.reduce(applyAction, EMPTY_WORKBENCH);
}

const names = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) => `member-${String(index)}`);

test("the party holds each Pokémon once and at most six", () => {
  const full = applied(names(PARTY_SIZE + 1).map((name) => ({ type: "add", name })));
  expect(full.party).toEqual(names(PARTY_SIZE));
  expect(applyAction(full, { type: "add", name: "member-0" })).toBe(full);
  expect(applyAction(full, { type: "remove", name: "member-2" }).party).not.toContain("member-2");
  expect(applyAction(full, { type: "clear" }).party).toEqual([]);
});

test("a replacement keeps the place of the member it replaces", () => {
  const party = applied([
    { type: "add", name: "goldeen" },
    { type: "add", name: "seel" },
  ]);
  expect(applyAction(party, { type: "replace", member: "goldeen", by: "omanyte" }).party).toEqual([
    "omanyte",
    "seel",
  ]);
  expect(applyAction(party, { type: "replace", member: "goldeen", by: "seel" })).toBe(party);
});

test("the bench holds four and forgets its reference when it leaves", () => {
  const bench = applied([
    ...names(BENCH_SIZE + 1).map((name): WorkbenchAction => ({ type: "compare", name })),
    { type: "pin", name: "member-1" },
  ]);
  expect(bench.bench).toHaveLength(BENCH_SIZE);
  expect(bench.reference).toBe("member-1");
  expect(applyAction(bench, { type: "pin", name: "absent" })).toBe(bench);
  expect(applyAction(bench, { type: "uncompare", name: "member-1" }).reference).toBeNull();
  expect(isEmptyWorkbench(bench)).toBe(false);
});

test("every action is announced in words", () => {
  expect(describeAction({ type: "remove", name: "lapras" })).toBe("Removed Lapras");
  expect(describeAction({ type: "replace", member: "goldeen", by: "omanyte" })).toBe(
    "Replaced Goldeen with Omanyte",
  );
  expect(describeAction({ type: "pin", name: null })).toBe("Unpinned the reference");
});

test("a workbench from outside keeps only well-formed names within the limits", () => {
  expect(
    sanitizedWorkbench({
      party: ["lapras", "lapras", "<script>", 3, ...names(PARTY_SIZE)],
      bench: ["seel"],
      reference: "lapras",
    }),
  ).toEqual({ party: ["lapras", ...names(PARTY_SIZE - 1)], bench: ["seel"], reference: null });
});

test("a saved workbench is read back, and anything else is ignored", () => {
  const saved = applied([
    { type: "add", name: "lapras" },
    { type: "compare", name: "seel" },
    { type: "pin", name: "seel" },
  ]);
  expect(parseWorkbench(JSON.stringify(saved))).toEqual(saved);
  expect(parseWorkbench("not json")).toBeNull();
  expect(parseWorkbench("42")).toBeNull();
  expect(parseWorkbench("{}")).toEqual(EMPTY_WORKBENCH);
});

test("an action that changes nothing returns the same workbench", () => {
  const bench = applied([
    { type: "compare", name: "seel" },
    { type: "compare", name: "lapras" },
    { type: "pin", name: "seel" },
  ]);
  expect(applyAction(EMPTY_WORKBENCH, { type: "remove", name: "lapras" })).toBe(EMPTY_WORKBENCH);
  expect(applyAction(EMPTY_WORKBENCH, { type: "clear" })).toBe(EMPTY_WORKBENCH);
  expect(applyAction(bench, { type: "compare", name: "seel" })).toBe(bench);
  expect(applyAction(bench, { type: "uncompare", name: "absent" })).toBe(bench);
  expect(applyAction(bench, { type: "pin", name: "seel" })).toBe(bench);
  expect(applyAction(bench, { type: "replace", member: "absent", by: "goldeen" })).toBe(bench);
  expect(applyAction(bench, { type: "uncompare", name: "lapras" }).reference).toBe("seel");
  expect(applyAction(bench, { type: "pin", name: null }).reference).toBeNull();
});

test("the other actions are announced in words too", () => {
  expect(describeAction({ type: "add", name: "lapras" })).toBe("Added Lapras to the party");
  expect(describeAction({ type: "clear" })).toBe("Cleared the party");
  expect(describeAction({ type: "compare", name: "seel" })).toBe("Compared Seel");
  expect(describeAction({ type: "uncompare", name: "seel" })).toBe("Stopped comparing Seel");
  expect(describeAction({ type: "pin", name: "seel" })).toBe("Pinned Seel as the reference");
});
