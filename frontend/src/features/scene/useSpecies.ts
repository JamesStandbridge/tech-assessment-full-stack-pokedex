import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { SpeciesResponse } from "../../api/contract";
import { useApi } from "../api/ApiContext";

/** The 151 species; the snapshot never changes while the page is open. */
export function useSpecies(): UseQueryResult<SpeciesResponse> {
  const api = useApi();
  return useQuery({
    queryKey: ["species"],
    queryFn: ({ signal }) => api.species(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
