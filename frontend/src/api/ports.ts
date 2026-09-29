import type {
  EntityDetail,
  EntityKind,
  EntityRef,
  SearchResponse,
  SuggestResponse,
} from "./contract";

export interface SearchParams {
  readonly query: string;
  readonly kind?: EntityKind;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface SearchApi {
  search(params: SearchParams, signal: AbortSignal): Promise<SearchResponse>;
}

export interface SuggestApi {
  suggest(query: string, signal: AbortSignal): Promise<SuggestResponse>;
}

export interface EntityApi {
  entity(ref: EntityRef, signal: AbortSignal): Promise<EntityDetail>;
}

export type PokedexApi = SearchApi & SuggestApi & EntityApi;
