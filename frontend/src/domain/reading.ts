import type { SearchPlan, SearchResponse } from "../api/contract";

/** How a query was read, which decides the results view (ADR 10). */
export type Reading = "name" | "weather" | "effect" | "criteria" | "exploration";

const ALTERNATIVE_SEPARATOR = " or ";

/** Apply the precedence of ADR 10: name, weather, effect, criteria, then exploration. */
export function readingOfPlan(plan: SearchPlan | undefined): Reading {
  if (plan === undefined) {
    return "exploration";
  }
  if (plan.name !== null || plan.dex_number !== null) {
    return "name";
  }
  if (plan.weather !== null) {
    return "weather";
  }
  if (plan.effect !== null) {
    return "effect";
  }
  if (plan.stat_sort.length > 0 || plan.stat_filters.length > 0) {
    return "criteria";
  }
  return "exploration";
}

/** Return the reading of a response, taken from its first alternative plan. */
export function readingOf(response: SearchResponse): Reading {
  return readingOfPlan(response.interpretation.alternatives[0]);
}

/**
 * Name every reading of an ambiguous query (SYS-UI-018). The summary joins one
 * description per plan; it is split only when the parts match the plans.
 */
export function readingNames(response: SearchResponse): readonly string[] {
  const { alternatives, summary } = response.interpretation;
  if (alternatives.length < 2) {
    return [];
  }
  const parts = summary.split(ALTERNATIVE_SEPARATOR);
  return parts.length === alternatives.length ? parts : [summary];
}
