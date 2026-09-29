import { expect, test } from "vitest";

import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { linkLabel, weatherGraph } from "./graph";

test("only a weather reading has a relation graph", () => {
  expect(weatherGraph(bulbaSearch)).toBeNull();
});

test("the weather links to abilities and moves, and Pokémon hang from their source", () => {
  const graph = weatherGraph(rainTeamSearch);
  expect(graph).not.toBeNull();
  if (graph === null) return;
  const labels = graph.links.map((link) => linkLabel(graph, link));
  expect(labels).toContain("Rain → Swift Swim");
  expect(labels).toContain("Rain → Thunder");
  expect(labels.some((label) => label.endsWith("→ Rain"))).toBe(false);
  expect(new Set(labels).size).toBe(labels.length);
  const pokemon = graph.nodes.filter((node) => node.group === "pokemon");
  for (const node of pokemon) {
    expect(graph.links.some((link) => link.target === node.id)).toBe(true);
  }
});

test("a link to an unknown node falls back to its identifier", () => {
  const graph = { nodes: [], links: [] };
  expect(linkLabel(graph, { source: "a", target: "b" })).toBe("a → b");
});
