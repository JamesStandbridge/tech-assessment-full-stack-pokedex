import type { JSX } from "react";

import { createPokedexClient } from "../api/client";
import type { PokedexApi } from "../api/ports";
import { SearchPage } from "../features/search/SearchPage";
import { Providers } from "./Providers";

const TIMEOUT_MS = 10_000;
const defaultApi = createPokedexClient({ baseUrl: "", timeoutMs: TIMEOUT_MS });

/** Composition root: the only place a concrete adapter is chosen. */
export function App({ api = defaultApi }: { readonly api?: PokedexApi }): JSX.Element {
  return (
    <Providers api={api}>
      <SearchPage />
    </Providers>
  );
}
