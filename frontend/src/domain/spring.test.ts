import { describe, expect, test } from "vitest";

import { distance, point } from "./geometry";
import { isSettled, restingSpring, retarget, springAt } from "./spring";

describe("spring", () => {
  const moving = retarget(restingSpring(point(0, 0, 0)), point(10, 0, 0), { time: 1, delay: 0 });

  test("starts where it was, at rest", () => {
    expect(springAt(moving, 1).position).toEqual(point(0, 0, 0));
    expect(springAt(moving, 0.5).position).toEqual(point(0, 0, 0));
  });

  test("reaches its target without overshooting", () => {
    const samples = [1.2, 1.5, 2, 3, 5].map((time) => springAt(moving, time).position.x);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
    expect(samples.every((x) => x <= 10)).toBe(true);
    expect(distance(springAt(moving, 4).position, point(10, 0, 0))).toBeLessThan(0.01);
  });

  test("keeps its motion when sent elsewhere midway", () => {
    const midway = springAt(moving, 1.3);
    const turned = retarget(moving, point(0, 10, 0), { time: 1.3, delay: 0 });
    expect(springAt(turned, 1.3)).toEqual(midway);
  });

  test("waits for its delay before moving", () => {
    const delayed = retarget(restingSpring(point(0, 0, 0)), point(5, 0, 0), {
      time: 0,
      delay: 0.5,
    });
    expect(springAt(delayed, 0.4).position).toEqual(point(0, 0, 0));
    expect(springAt(delayed, 0.8).position.x).toBeGreaterThan(0);
  });

  test("settles after a couple of seconds", () => {
    expect(isSettled(moving, 1.5)).toBe(false);
    expect(isSettled(moving, 4)).toBe(true);
  });
});
