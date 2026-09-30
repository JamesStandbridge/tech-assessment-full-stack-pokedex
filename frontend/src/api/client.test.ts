import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { pikachuDetail } from "../test/recorded/pikachuDetail";
import { pikaSuggest } from "../test/recorded/pikaSuggest";
import { speciesList } from "../test/recorded/speciesList";
import { createPokedexClient } from "./client";
import type { ErrorResponse } from "./contract";
import { ApiError } from "./errors";

const BASE = "http://pokedex.test";
const server = setupServer();
const api = createPokedexClient({ baseUrl: BASE, timeoutMs: 200 });
const signal = (): AbortSignal => new AbortController().signal;

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

function answer(status: number, code: ErrorResponse["error"]["code"], message: string): void {
  server.use(
    http.get(`${BASE}/api/search`, () =>
      HttpResponse.json<ErrorResponse>({ error: { code, message } }, { status }),
    ),
  );
}

async function searchError(): Promise<ApiError> {
  const error: unknown = await api.search({ query: "bulba" }, signal()).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  if (!(error instanceof ApiError)) throw new Error("Expected an ApiError.");
  return error;
}

describe("successful requests", () => {
  test("a search sends the query and pagination parameters and returns the response", async () => {
    let received: URLSearchParams | undefined;
    server.use(
      http.get(`${BASE}/api/search`, ({ request }) => {
        received = new URL(request.url).searchParams;
        return HttpResponse.json(bulbaSearch);
      }),
    );
    const response = await api.search(
      { query: "rain team", kind: "pokemon", cursor: "abc", limit: 5 },
      signal(),
    );
    expect(response).toEqual(bulbaSearch);
    expect(Object.fromEntries(received ?? [])).toEqual({
      q: "rain team",
      kind: "pokemon",
      cursor: "abc",
      limit: "5",
    });
  });

  test("suggestions and entity details use their own resources", async () => {
    server.use(
      http.get(`${BASE}/api/suggest`, () => HttpResponse.json(pikaSuggest)),
      http.get(`${BASE}/api/entities/pokemon/pikachu`, () => HttpResponse.json(pikachuDetail)),
    );
    expect(await api.suggest("pika", signal())).toEqual(pikaSuggest);
    expect(await api.entity({ kind: "pokemon", name: "pikachu" }, signal())).toEqual(pikachuDetail);
  });

  test("the species list has its own resource", async () => {
    server.use(http.get(`${BASE}/api/species`, () => HttpResponse.json(speciesList)));
    const response = await api.species(signal());
    expect(response.species).toHaveLength(151);
  });
});

describe("failed requests", () => {
  test("a 400 is an invalid query carrying the API's message", async () => {
    answer(400, "invalid_query", "The query must contain between 2 and 200 characters.");
    const error = await searchError();
    expect(error.kind).toBe("invalid");
    expect(error.message).toBe("The query must contain between 2 and 200 characters.");
  });

  test("a 404 is a missing entity", async () => {
    answer(404, "not_found", "No move is named 'rain-dance'.");
    expect((await searchError()).kind).toBe("not-found");
  });

  test("a 500 is a failure that exposes no server detail", async () => {
    answer(500, "internal_error", "secret detail");
    const error = await searchError();
    expect(error.kind).toBe("failed");
    expect(error.message).not.toContain("secret");
  });

  test("a network error is a failure", async () => {
    server.use(http.get(`${BASE}/api/search`, () => HttpResponse.error()));
    expect((await searchError()).kind).toBe("failed");
  });

  test("a response slower than the timeout is a failure", async () => {
    server.use(
      http.get(`${BASE}/api/search`, async () => {
        await delay(1000);
        return HttpResponse.json(bulbaSearch);
      }),
    );
    expect((await searchError()).kind).toBe("failed");
  });

  test("a request the caller aborts rejects with the abort, not a failure", async () => {
    server.use(
      http.get(`${BASE}/api/search`, async () => {
        await delay(1000);
        return HttpResponse.json(bulbaSearch);
      }),
    );
    const controller = new AbortController();
    const pending = api.search({ query: "bulba" }, controller.signal);
    controller.abort();
    const error: unknown = await pending.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toHaveProperty("name", "AbortError");
  });
});
