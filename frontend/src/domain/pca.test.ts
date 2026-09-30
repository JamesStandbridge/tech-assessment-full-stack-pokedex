import { describe, expect, test } from "vitest";

import { centerColumns, type Matrix, principalAxes, projection } from "./pca";

function matrix(rows: readonly (readonly number[])[]): Matrix {
  const cols = rows[0]?.length ?? 0;
  return { rows: rows.length, cols, data: Float64Array.from(rows.flat()) };
}

describe("principal axes", () => {
  test("find the direction the observations spread along, oriented by its largest loading", () => {
    const data = matrix([
      [1, 1, -1.2],
      [-1, -1, 1.2],
      [2, 2, -2.4],
      [-2, -2, 2.4],
    ]);
    centerColumns(data);
    const [axis] = principalAxes(data, 1);
    if (axis === undefined) throw new Error("no axis");
    const norm = Math.hypot(1, 1, 1.2);
    expect([...axis].map((value) => value * norm)).toEqual([
      expect.closeTo(-1),
      expect.closeTo(-1),
      expect.closeTo(1.2),
    ]);
    expect([...projection(data, axis)].map(Math.abs)).toEqual([
      expect.closeTo(norm),
      expect.closeTo(norm),
      expect.closeTo(2 * norm),
      expect.closeTo(2 * norm),
    ]);
  });

  test("of observations that do not spread are null", () => {
    const data = matrix([
      [3, 4],
      [3, 4],
    ]);
    centerColumns(data);
    expect([...data.data]).toEqual([0, 0, 0, 0]);
    for (const axis of principalAxes(data, 2)) expect([...axis]).toEqual([0, 0]);
  });
});
