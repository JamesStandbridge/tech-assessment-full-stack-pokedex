import { describe, expect, test } from "vitest";

import { type Contact, type Gesture, GestureTracker, wheelFactor } from "./gestures";

function track(): { readonly tracker: GestureTracker; readonly seen: Gesture[] } {
  const seen: Gesture[] = [];
  return { tracker: new GestureTracker((gesture) => seen.push(gesture)), seen };
}

function at(x: number, y: number, extra: Partial<Contact> = {}): Contact {
  return { id: 1, x, y, panning: false, ...extra };
}

describe("GestureTracker", () => {
  test("a pointer that moves unpressed hovers, and a press released in place clicks", () => {
    const { tracker, seen } = track();
    tracker.move(at(10, 20));
    tracker.down(at(10, 20));
    tracker.move(at(12, 21));
    tracker.up(at(12, 21));
    expect(seen).toEqual([
      { type: "hover", x: 10, y: 20 },
      { type: "click", x: 12, y: 21 },
    ]);
  });

  test("a primary drag turns by the movement of each step, and never clicks", () => {
    const { tracker, seen } = track();
    tracker.down(at(0, 0));
    tracker.move(at(10, 0));
    tracker.move(at(15, 5));
    tracker.up(at(15, 5));
    expect(seen).toEqual([
      { type: "drag", dx: 10, dy: 0, mode: "turn" },
      { type: "drag", dx: 5, dy: 5, mode: "turn" },
    ]);
  });

  test("a secondary or Shift drag pans", () => {
    const { tracker, seen } = track();
    tracker.down(at(0, 0, { panning: true }));
    tracker.move(at(0, 20, { panning: true }));
    expect(seen).toEqual([{ type: "drag", dx: 0, dy: 20, mode: "pan" }]);
  });

  test("two pointers pan by their midpoint and zoom by their spread", () => {
    const { tracker, seen } = track();
    tracker.down(at(0, 0));
    tracker.down(at(100, 0, { id: 2 }));
    tracker.move(at(200, 0, { id: 2 }));
    expect(seen).toEqual([
      { type: "drag", dx: 50, dy: 0, mode: "pan" },
      { type: "zoom", factor: 0.5, x: 100, y: 0 },
    ]);
    tracker.up(at(200, 0, { id: 2 }));
    tracker.up(at(0, 0));
    expect(seen.some((gesture) => gesture.type === "click")).toBe(false);
  });

  test("a cancelled press is forgotten, so the pointer hovers again", () => {
    const { tracker, seen } = track();
    tracker.down(at(0, 0));
    tracker.cancel(1);
    tracker.move(at(5, 5));
    expect(seen).toEqual([{ type: "hover", x: 5, y: 5 }]);
  });
});

describe("wheelFactor", () => {
  test("zooms out when the wheel turns down and in when it turns up", () => {
    expect(wheelFactor(100, 0)).toBeGreaterThan(1);
    expect(wheelFactor(-100, 0)).toBeLessThan(1);
    expect(wheelFactor(100, 0) * wheelFactor(-100, 0)).toBeCloseTo(1);
  });

  test("counts lines and pages in pixels", () => {
    expect(wheelFactor(1, 1)).toBeCloseTo(wheelFactor(16, 0));
    expect(wheelFactor(1, 2)).toBeCloseTo(wheelFactor(800, 0));
  });
});
