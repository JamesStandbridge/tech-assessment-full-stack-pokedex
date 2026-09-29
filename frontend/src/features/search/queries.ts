import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { SearchResponse, SuggestResponse } from "../../api/contract";
import { useApi } from "../api/ApiContext";
import { MIN_QUERY_LENGTH } from "./useSearchController";

/** Results of the query in the URL; earlier results stay shown, marked outdated, while loading. */
export function useSearchResults(query: string): UseQueryResult<SearchResponse> {
  const api = useApi();
  return useQuery({
    queryKey: ["search", query],
    queryFn: ({ signal }) => api.search({ query }, signal),
    enabled: query !== "",
    placeholderData: keepPreviousData,
  });
}

/**
 * Suggestions follow every keystroke and keep the previous answer while loading, so the
 * options exist when the field decides to open them; stale requests are cancelled.
 */
export function useSuggestions(text: string): UseQueryResult<SuggestResponse> {
  const api = useApi();
  const trimmed = text.trim();
  return useQuery({
    queryKey: ["suggest", trimmed],
    queryFn: ({ signal }) => api.suggest(trimmed, signal),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
  });
}
