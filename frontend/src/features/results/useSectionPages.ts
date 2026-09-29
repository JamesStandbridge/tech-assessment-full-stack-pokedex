import { useInfiniteQuery } from "@tanstack/react-query";

import type { EntityKind, Result, Section } from "../../api/contract";
import { useApi } from "../api/ApiContext";

export interface SectionPages {
  readonly results: readonly Result[];
  readonly total: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => void;
}

function sectionOf(sections: readonly Section[], kind: EntityKind): Section | undefined {
  return sections.find((section) => section.kind === kind);
}

/**
 * The pages of one section: the first comes with the search, the next ones are
 * appended on request from the section cursor (SYS-UI-017).
 */
export function useSectionPages(query: string, first: Section): SectionPages {
  const api = useApi();
  const pages = useInfiniteQuery({
    queryKey: ["section", query, first.kind],
    queryFn: async ({ pageParam, signal }): Promise<Section> => {
      const page = pageParam === "" ? {} : { cursor: pageParam };
      const response = await api.search({ query, kind: first.kind, ...page }, signal);
      return (
        sectionOf(response.sections, first.kind) ?? { ...first, results: [], next_cursor: null }
      );
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    initialData: { pages: [first], pageParams: [""] },
    staleTime: Infinity,
  });
  const loaded = pages.data.pages;
  return {
    results: loaded.flatMap((page) => page.results),
    total: first.total,
    hasMore: pages.hasNextPage,
    loadingMore: pages.isFetchingNextPage,
    loadMore: () => void pages.fetchNextPage(),
  };
}
