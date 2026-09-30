import { describe, expect, test } from "vitest";

import { speciesList } from "../test/recorded/speciesList";
import { constellation, typeClusters } from "./constellation";
import { distance, type Point } from "./geometry";

const species = speciesList.species;
const places = constellation(species);

function place(name: string): Point {
  const found = places.get(name);
  if (found === undefined) throw new Error(`no place for ${name}`);
  return found;
}

function meanDistance(names: readonly string[]): number {
  const pairs = names.flatMap((a, index) =>
    names.slice(index + 1).map((b) => distance(place(a), place(b))),
  );
  return pairs.reduce((sum, value) => sum + value, 0) / pairs.length;
}

describe("constellation", () => {
  test("places every species once", () => {
    expect(places.size).toBe(151);
  });

  test("places the same species at the same point every time", () => {
    expect(constellation(species)).toEqual(places);
  });

  test("keeps every star apart from the others", () => {
    const points = [...places.values()];
    const closest = points.flatMap((a, index) =>
      points.slice(index + 1).map((b) => distance(a, b)),
    );
    expect(Math.min(...closest)).toBeGreaterThan(0.8);
  });

  test("keeps the stars within the frame", () => {
    for (const { x, y, z } of places.values()) {
      expect(Math.abs(x)).toBeLessThan(17);
      expect(Math.abs(y)).toBeLessThan(12);
      expect(Math.abs(z)).toBeLessThan(9);
    }
  });

  test("brings evolutions closer than unrelated species", () => {
    const family = meanDistance(["bulbasaur", "ivysaur", "venusaur"]);
    const unrelated = meanDistance(["bulbasaur", "gyarados", "alakazam"]);
    expect(family).toBeLessThan(unrelated);
  });

  test("names the clusters of the most common primary types, largest first", () => {
    const clusters = typeClusters(species, places);
    expect(clusters[0]?.type).toBe("water");
    expect(clusters.map((cluster) => cluster.size)).toEqual(
      [...clusters.map((cluster) => cluster.size)].sort((a, b) => b - a),
    );
  });

  test("keeps the names of clusters apart", () => {
    const centers = typeClusters(species, places).map((cluster) => cluster.center);
    const gaps = centers.flatMap((a, index) => centers.slice(index + 1).map((b) => distance(a, b)));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(4.5);
  });
});
