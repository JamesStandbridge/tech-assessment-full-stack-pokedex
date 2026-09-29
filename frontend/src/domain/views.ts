import type { Result, Section, StatName, WeatherRole } from "../api/contract";
import { weatherRole } from "./reasons";
import { statValue } from "./stats";

export interface StatBar {
  readonly stat: StatName;
  readonly value: number;
  /** Share of the highest value of the stat among the results shown, from 0 to 1. */
  readonly share: number;
}

export interface RoleGroup {
  readonly role: WeatherRole;
  readonly results: readonly Result[];
}

const WEATHER_ROLE_ORDER: readonly WeatherRole[] = [
  "setter",
  "benefit",
  "protection",
  "mixed",
  "drawback",
];

/**
 * Return the bars of a result for the compared stats, scaled to the highest
 * value among the results shown, which the user can see.
 */
export function statBars(
  result: Result,
  stats: readonly StatName[],
  results: readonly Result[],
): readonly StatBar[] {
  return stats.flatMap((stat) => {
    const value = statValue(result, stat);
    if (value === null) {
      return [];
    }
    const highest = Math.max(...results.map((other) => statValue(other, stat) ?? 0));
    return [{ stat, value, share: highest > 0 ? Math.max(value, 0) / highest : 0 }];
  });
}

/** Group the results of a section by weather role, in the order of WEATHER_ROLE_ORDER. */
export function roleGroups(section: Section): readonly RoleGroup[] {
  return WEATHER_ROLE_ORDER.flatMap((role) => {
    const results = section.results.filter((result) => weatherRole(result) === role);
    return results.length > 0 ? [{ role, results }] : [];
  });
}
