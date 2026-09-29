import { describe, expect, test } from "vitest";

import type { SearchResponse } from "../api/contract";
import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { emptySearch } from "../test/recorded/emptySearch";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { legendarySearch } from "../test/recorded/legendarySearch";
import { psychicSearch } from "../test/recorded/psychicSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { type Reading, readingNames, readingOf, readingOfPlan } from "./reading";

describe("reading of a response", () => {
  test.each<[string, SearchResponse, Reading]>([
    ["a partial name", bulbaSearch, "name"],
    ["an unknown name", emptySearch, "name"],
    ["a stat and a type", fastElectricSearch, "criteria"],
    ["an effect", sleepSearch, "effect"],
    ["a weather", rainTeamSearch, "weather"],
    ["a characteristic", legendarySearch, "exploration"],
    ["an ambiguous word, by its first plan", psychicSearch, "exploration"],
  ])("%s", (_, response, reading) => {
    expect(readingOf(response)).toBe(reading);
  });

  test("a weather outranks the stats that sort its results", () => {
    const plan = rainTeamSearch.interpretation.alternatives[0];
    expect(plan).toBeDefined();
    if (plan === undefined) return;
    const sorted = { ...plan, stat_sort: [{ stat: "speed" as const, direction: "desc" as const }] };
    expect(readingOfPlan(sorted)).toBe("weather");
  });

  test("a response without a plan is explored", () => {
    expect(readingOfPlan(undefined)).toBe("exploration");
  });
});

describe("named readings", () => {
  test("every reading of an ambiguous query is named", () => {
    expect(readingNames(psychicSearch)).toEqual(["of type psychic", "names matching 'psychic'"]);
  });

  test("a single reading needs no name", () => {
    expect(readingNames(rainTeamSearch)).toEqual([]);
  });

  test("a summary that does not split into one part per plan is kept whole", () => {
    const summary = "of type psychic";
    const response = {
      ...psychicSearch,
      interpretation: { ...psychicSearch.interpretation, summary },
    };
    expect(readingNames(response)).toEqual([summary]);
  });
});
