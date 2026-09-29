import createClient from "openapi-fetch";

import type { ErrorResponse } from "./contract";
import { failure, fromStatus } from "./errors";
import type { PokedexApi, SearchParams } from "./ports";
import type { paths } from "./schema.gen";

export interface ClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly fetch?: typeof globalThis.fetch;
}

interface Outcome<T> {
  readonly data?: T;
  readonly error?: unknown;
  readonly response: Response;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === "object" && value !== null && "error" in value;
}

async function send<T>(
  request: (signal: AbortSignal) => Promise<Outcome<T>>,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<T> {
  let outcome: Outcome<T>;
  try {
    outcome = await request(AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]));
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw failure();
  }
  if (outcome.response.ok && outcome.data !== undefined) {
    return outcome.data;
  }
  const body = isErrorResponse(outcome.error) ? outcome.error : undefined;
  throw fromStatus(outcome.response.status, body);
}

type SearchQuery = paths["/api/search"]["get"]["parameters"]["query"];

function searchQuery(params: SearchParams): SearchQuery {
  return {
    q: params.query,
    ...(params.kind === undefined ? {} : { kind: params.kind }),
    ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
    ...(params.limit === undefined ? {} : { limit: params.limit }),
  };
}

/** Create the HTTP adapter of every port, typed by the contract. */
export function createPokedexClient(options: ClientOptions): PokedexApi {
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: options.fetch ?? ((request: Request) => globalThis.fetch(request)),
  });
  const { timeoutMs } = options;
  return {
    search: (params, signal) =>
      send(
        (combined) =>
          client.GET("/api/search", {
            params: { query: searchQuery(params) },
            signal: combined,
          }),
        signal,
        timeoutMs,
      ),
    suggest: (query, signal) =>
      send(
        (combined) =>
          client.GET("/api/suggest", { params: { query: { q: query } }, signal: combined }),
        signal,
        timeoutMs,
      ),
    entity: (ref, signal) =>
      send(
        (combined) =>
          client.GET("/api/entities/{kind}/{name}", {
            params: { path: { kind: ref.kind, name: ref.name } },
            signal: combined,
          }),
        signal,
        timeoutMs,
      ),
  };
}
