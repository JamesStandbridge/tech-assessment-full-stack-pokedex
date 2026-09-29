import { expect, test } from "vitest";

import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { resultNamed } from "../test/find";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { comparedStats, STAT_LABELS, statValue } from "./stats";

const electrode = resultNamed(fastElectricSearch, "pokemon", "electrode");

test("base and derived stats of a Pokémon", () => {
  expect(statValue(electrode, "speed")).toBe(150);
  expect(statValue(electrode, "total")).toBe(490);
  expect(statValue(electrode, "bulk")).toBe(60 + 70 + 80);
  expect(statValue(electrode, "offense")).toBe(80);
  expect(statValue(electrode, "power")).toBeNull();
});

test("attributes of a move, and nothing for an ability", () => {
  const spore = resultNamed(sleepSearch, "move", "spore");
  expect(statValue(spore, "accuracy")).toBe(100);
  expect(statValue(spore, "power")).toBeNull();
  expect(statValue(spore, "priority")).toBe(0);
  expect(statValue(spore, "speed")).toBeNull();
  expect(statValue(resultNamed(rainTeamSearch, "ability", "swift-swim"), "speed")).toBeNull();
});

test("a criteria reading compares its sorted then filtered stats, once each", () => {
  const plan = fastElectricSearch.interpretation.alternatives[0];
  expect(comparedStats(plan)).toEqual(["speed"]);
  expect(comparedStats(undefined)).toEqual([]);
  if (plan === undefined) return;
  const filtered = {
    ...plan,
    stat_filters: [
      { stat: "speed" as const, comparator: "gt" as const, value: 100 },
      { stat: "attack" as const, comparator: "gte" as const, value: 50 },
    ],
  };
  expect(comparedStats(filtered)).toEqual(["speed", "attack"]);
});

test("every stat has a label", () => {
  expect(STAT_LABELS["special-attack"]).toBe("Sp. Atk");
});

test("every base stat of a Pokémon reads its own value", () => {
  expect(
    (["hp", "attack", "defense", "special-attack", "special-defense"] as const).map((stat) =>
      statValue(electrode, stat),
    ),
  ).toEqual([60, 50, 70, 80, 80]);
  expect(
    (["accuracy", "pp", "priority"] as const).map((stat) => statValue(electrode, stat)),
  ).toEqual([null, null, null]);
});

test("a move has no Pokémon stat, and power and PP of its own", () => {
  const hypnosis = resultNamed(sleepSearch, "move", "hypnosis");
  expect(
    (
      [
        "hp",
        "attack",
        "defense",
        "special-attack",
        "special-defense",
        "total",
        "bulk",
        "offense",
      ] as const
    ).map((stat) => statValue(hypnosis, stat)),
  ).toEqual([null, null, null, null, null, null, null, null]);
  expect(statValue(hypnosis, "pp")).toBe(20);
});
