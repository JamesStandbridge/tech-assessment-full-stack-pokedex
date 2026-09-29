import { expect, test } from "vitest";

import { pokemonNamed } from "../test/find";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { inTeam, memberOf, sharedWeathers, TEAM_SIZE, withMember, withoutMember } from "./team";

const lapras = memberOf(pokemonNamed(rainTeamSearch, "lapras"), "rain");
const squirtle = memberOf(pokemonNamed(rainTeamSearch, "squirtle"), "rain");
const electrode = memberOf(pokemonNamed(fastElectricSearch, "electrode"), null);

test("a Pokémon found in a weather search helps with that weather", () => {
  expect(lapras.weathers).toEqual(["rain"]);
  expect(electrode.weathers).toEqual([]);
});

test("the team holds each Pokémon once and at most six", () => {
  const once = withMember(withMember([], lapras), lapras);
  expect(once).toHaveLength(1);
  const full = Array.from({ length: TEAM_SIZE }, (_, index) => ({
    ...squirtle,
    ref: { kind: "pokemon" as const, name: `member-${String(index)}` },
  })).reduce<readonly (typeof squirtle)[]>((team, member) => withMember(team, member), []);
  expect(withMember(full, lapras)).toHaveLength(TEAM_SIZE);
  expect(inTeam(full, lapras.ref)).toBe(false);
  expect(withoutMember(once, lapras.ref)).toEqual([]);
});

test("shared weathers are those every member helps with", () => {
  expect(sharedWeathers([])).toEqual([]);
  expect(sharedWeathers([lapras, squirtle])).toEqual(["rain"]);
  expect(sharedWeathers([lapras, electrode])).toEqual([]);
});
