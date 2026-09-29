import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { type JSX, type ReactNode, useState } from "react";

import { retryDelay, shouldRetry } from "../api/errors";
import type { PokedexApi } from "../api/ports";
import { ApiProvider } from "../features/api/ApiContext";

const STALE_MS = 5 * 60 * 1000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        staleTime: STALE_MS,
        refetchOnWindowFocus: false,
      },
    },
  });
}

interface ProvidersProps {
  readonly api: PokedexApi;
  readonly children: ReactNode;
}

/** Request state, URL state and the ports of the whole application. */
export function Providers({ api, children }: ProvidersProps): JSX.Element {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ApiProvider api={api}>{children}</ApiProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
