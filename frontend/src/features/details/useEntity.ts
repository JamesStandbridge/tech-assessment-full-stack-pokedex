import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { EntityDetail, EntityRef } from "../../api/contract";
import { useApi } from "../api/ApiContext";

export function useEntity(ref: EntityRef): UseQueryResult<EntityDetail> {
  const api = useApi();
  return useQuery({
    queryKey: ["entity", ref.kind, ref.name],
    queryFn: ({ signal }) => api.entity(ref, signal),
  });
}
