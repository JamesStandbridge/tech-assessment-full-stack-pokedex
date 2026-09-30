import { expect, test } from "vitest";

import { abilityNamed, pokemonNamed, resultNamed } from "../test/find";
import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { assertNever } from "./assertNever";
import { displayName, kindLabel, refKey, refOf, resultSummary } from "./entities";
import { meaningfulTerms, termTone } from "./terms";

test("entities have a stable key and a readable name", () => {
  const bulbasaur = resultNamed(bulbaSearch, "pokemon", "bulbasaur");
  expect(refKey(refOf(bulbasaur))).toBe("pokemon:bulbasaur");
  expect(displayName("mr-mime")).toBe("Mr Mime");
});

test("every kind of result has a one-line summary", () => {
  expect(resultSummary(resultNamed(bulbaSearch, "pokemon", "bulbasaur"))).toBe("Seed Pokémon");
  expect(resultSummary(resultNamed(sleepSearch, "move", "spore"))).toBe("status move");
  expect(resultSummary(resultNamed(rainTeamSearch, "ability", "swift-swim"))).toMatch(/Speed/);
});

test("kind labels follow the count", () => {
  expect([kindLabel("pokemon", 2), kindLabel("move", 1), kindLabel("ability", 3)]).toEqual([
    "Pokémon",
    "Move",
    "Abilities",
  ]);
});

test("terms keep their meaning and drop fillers", () => {
  expect(termTone("dex-number")).toBe("entity");
  expect(termTone("ignored")).toBe("ignored");
  expect(meaningfulTerms(rainTeamSearch.terms).map((term) => term.text)).toEqual(["rain"]);
});

test("summaries fall back when the dataset lacks a genus or an effect", () => {
  const bulbasaur = pokemonNamed(bulbaSearch, "bulbasaur");
  expect(resultSummary({ ...bulbasaur, genus: null })).toBe("grass / poison");
  const swiftSwim = abilityNamed(rainTeamSearch, "swift-swim");
  expect(resultSummary({ ...swiftSwim, short_effect: null })).toBe(
    `Generation ${swiftSwim.generation}`,
  );
});

test("kind labels have a singular and a plural", () => {
  expect([kindLabel("move", 2), kindLabel("ability", 1)]).toEqual(["Moves", "Ability"]);
});

test("an impossible value fails loudly", () => {
  // @ts-expect-error -- a string is impossible here by design; the test exercises the runtime guard.
  expect(() => assertNever("unexpected")).toThrow('Unexpected value: "unexpected"');
});
