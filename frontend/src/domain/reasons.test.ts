import { expect, test } from "vitest";

import { resultNamed } from "../test/find";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { sunTeamSearch } from "../test/recorded/sunTeamSearch";
import { effectChance, formatChance, reasonModel, weatherRole } from "./reasons";

test("chances are whole percentages, and small chances stay visible", () => {
  expect([1, 0.6, 0.0667, 0.004, 0].map(formatChance)).toEqual(["100%", "60%", "7%", "<1%", "0%"]);
});

test("a result found through a relationship names the related entity", () => {
  const paras = resultNamed(sleepSearch, "pokemon", "paras");
  const [reason] = paras.reasons;
  expect(reason).toBeDefined();
  if (reason === undefined) return;
  expect(reasonModel(reason)).toEqual({
    text: "Causes sleep, 100% chance through spore",
    related: { kind: "move", name: "spore" },
    tone: "neutral",
    chance: 1,
  });
});

test("the effect chance and the weather role come from the matching reasons", () => {
  expect(effectChance(resultNamed(sleepSearch, "move", "hypnosis"))).toBe(0.6);
  expect(effectChance(resultNamed(sunTeamSearch, "move", "thunder"))).toBeNull();
  expect(weatherRole(resultNamed(sunTeamSearch, "move", "thunder"))).toBe("drawback");
  expect(weatherRole(resultNamed(sleepSearch, "move", "spore"))).toBeNull();
});

test("a weather reason takes the tone of its role", () => {
  const [reason] = resultNamed(sunTeamSearch, "ability", "drought").reasons;
  expect(reason === undefined ? null : reasonModel(reason).tone).toBe("setter");
});
