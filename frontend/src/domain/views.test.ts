import { expect, test } from "vitest";

import { resultNamed, sectionOf } from "../test/find";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { sunTeamSearch } from "../test/recorded/sunTeamSearch";
import { roleGroups, statBars } from "./views";

test("stat bars are scaled to the highest value among the results shown", () => {
  const { results } = sectionOf(fastElectricSearch, "pokemon");
  const electrode = resultNamed(fastElectricSearch, "pokemon", "electrode");
  const raichu = resultNamed(fastElectricSearch, "pokemon", "raichu");
  expect(statBars(electrode, ["speed"], results)).toEqual([
    { stat: "speed", value: 150, share: 1 },
  ]);
  expect(statBars(raichu, ["speed"], results)).toEqual([
    { stat: "speed", value: 110, share: 110 / 150 },
  ]);
});

test("a stat the result lacks has no bar", () => {
  const { results } = sectionOf(fastElectricSearch, "pokemon");
  const electrode = resultNamed(fastElectricSearch, "pokemon", "electrode");
  expect(statBars(electrode, ["power"], results)).toEqual([]);
});

test("a stat whose highest value is zero gets empty bars", () => {
  const move = resultNamed(sunTeamSearch, "move", "thunder");
  expect(statBars(move, ["priority"], [move])).toEqual([{ stat: "priority", value: 0, share: 0 }]);
});

test("weather results are grouped by role, setters first and drawbacks last", () => {
  const abilities = roleGroups(sectionOf(sunTeamSearch, "ability"));
  expect(abilities[0]?.role).toBe("setter");
  expect(abilities[0]?.results.map((result) => result.name)).toContain("drought");
  const moves = roleGroups(sectionOf(sunTeamSearch, "move"));
  expect(moves.map((group) => group.role)).toEqual(["benefit", "drawback"]);
  expect(moves.at(-1)?.results.map((result) => result.name)).toEqual(["thunder"]);
});
