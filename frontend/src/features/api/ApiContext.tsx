import { createContext, type JSX, type ReactNode, use } from "react";

import type { PokedexApi } from "../../api/ports";

const ApiContext = createContext<PokedexApi | null>(null);

interface ApiProviderProps {
  readonly api: PokedexApi;
  readonly children: ReactNode;
}

/** Provide the ports to every feature; the composition root chooses the adapter. */
export function ApiProvider({ api, children }: ApiProviderProps): JSX.Element {
  return <ApiContext value={api}>{children}</ApiContext>;
}

export function useApi(): PokedexApi {
  const api = use(ApiContext);
  if (api === null) {
    throw new Error("useApi must be used inside an ApiProvider.");
  }
  return api;
}
