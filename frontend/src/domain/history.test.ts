import { expect, test } from "vitest";

import { canRedo, canUndo, HISTORY_LIMIT, historyOf, record, redo, undo } from "./history";

test("undo and redo walk the labelled changes", () => {
  const history = record(record(historyOf(0), { state: 1, label: "one" }), {
    state: 2,
    label: "two",
  });
  const undone = undo(history);
  expect(undone.present).toEqual({ state: 1, label: "one" });
  expect(canRedo(undone)).toBe(true);
  expect(redo(undone).present).toEqual({ state: 2, label: "two" });
  expect(undo(undo(undone)).present.state).toBe(0);
  expect(canUndo(undo(undone))).toBe(false);
});

test("a new change forgets the undone ones and an unchanged state records nothing", () => {
  const undone = undo(record(historyOf(0), { state: 1, label: "one" }));
  const changed = record(undone, { state: 3, label: "three" });
  expect(canRedo(changed)).toBe(false);
  expect(record(changed, { state: 3, label: "again" })).toBe(changed);
});

test("the history keeps at most its limit of changes", () => {
  const long = Array.from({ length: HISTORY_LIMIT + 10 }, (_, index) => index + 1).reduce(
    (history, state) => record(history, { state, label: String(state) }),
    historyOf(0),
  );
  expect(long.past).toHaveLength(HISTORY_LIMIT);
  expect(undo(long).present.state).toBe(HISTORY_LIMIT + 9);
});

test("undo and redo at the ends change nothing", () => {
  const history = historyOf("start");
  expect(undo(history)).toBe(history);
  expect(redo(history)).toBe(history);
});
