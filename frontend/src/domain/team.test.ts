import { expect, test } from "vitest";

import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sharedWeathers, weatherHelpers } from "./team";

const rain = weatherHelpers(rainTeamSearch);

test("a weather search names the Pokémon that help with its weather", () => {
  expect(rain.has("lapras")).toBe(true);
  expect(rain.has("swift-swim")).toBe(false);
  expect(weatherHelpers(fastElectricSearch).size).toBe(0);
});

test("shared weathers are those every member helps with", () => {
  const helpers = new Map([["rain", rain]]);
  expect(sharedWeathers([], helpers)).toEqual([]);
  expect(sharedWeathers(["lapras", "squirtle"], helpers)).toEqual(["rain"]);
  expect(sharedWeathers(["lapras", "electrode"], helpers)).toEqual([]);
});
