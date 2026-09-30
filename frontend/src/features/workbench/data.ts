import { useQueries } from "@tanstack/react-query";

import type { Species } from "../../api/contract";
import { sharedWeathers, WEATHER_SEARCHES, weatherHelpers } from "../../domain/team";
import { useApi } from "../api/ApiContext";
import { useSpecies } from "../scene/useSpecies";

/** The species behind the names of the workbench; unknown names are left out. */
export function useContenders(names: readonly string[]): readonly Species[] {
  const species = useSpecies().data?.species ?? [];
  const byName = new Map(species.map((one) => [one.name, one]));
  return names.flatMap((name) => byName.get(name) ?? []);
}

/** The API's largest page, enough for every Pokémon a weather search finds. */
const HELPERS_LIMIT = 100;

/** The weathers the whole party helps with, from the search of each weather (ADR 13). */
export function useSharedWeathers(party: readonly string[]): readonly string[] {
  const api = useApi();
  const searches = Object.entries(WEATHER_SEARCHES);
  const results = useQueries({
    queries: searches.map(([, query]) => ({
      queryKey: ["weather-helpers", query],
      queryFn: ({ signal }: { readonly signal: AbortSignal }) =>
        api.search({ query, kind: "pokemon", limit: HELPERS_LIMIT }, signal),
      enabled: party.length > 0,
    })),
  });
  const helpers = new Map(
    searches.flatMap(([weather], index) => {
      const response = results[index]?.data;
      return response === undefined ? [] : [[weather, weatherHelpers(response)] as const];
    }),
  );
  return sharedWeathers(party, helpers);
}
