import type { SearchResponse, WeatherRole } from "../api/contract";
import { allResults } from "./sceneTypes";

/** The weathers a party can share, each looked up by its own search (ADR 13). */
export const WEATHER_SEARCHES: Readonly<Record<string, string>> = {
  rain: "rain team",
  sun: "sun team",
  sandstorm: "sandstorm team",
  hail: "hail team",
};

const HELPFUL_ROLES: ReadonlySet<WeatherRole> = new Set(["setter", "benefit", "protection"]);

/** The Pokémon a weather search finds to set, benefit from or be protected in that weather. */
export function weatherHelpers(response: SearchResponse): ReadonlySet<string> {
  return new Set(
    allResults(response)
      .filter(
        (result) =>
          result.kind === "pokemon" &&
          result.reasons.some(
            (reason) => reason.weather_role !== null && HELPFUL_ROLES.has(reason.weather_role),
          ),
      )
      .map((result) => result.name),
  );
}

/** The weathers every member of the party helps with (SYS-UI-013). */
export function sharedWeathers(
  party: readonly string[],
  helpers: ReadonlyMap<string, ReadonlySet<string>>,
): readonly string[] {
  if (party.length === 0) return [];
  return [...helpers]
    .filter(([, names]) => party.every((name) => names.has(name)))
    .map(([weather]) => weather);
}
