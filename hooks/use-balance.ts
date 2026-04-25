"use client";

import { useQuery, useMutationState } from "@tanstack/react-query";
import { hcmClient } from "@/lib/hcm-client";
import { queryKeys } from "@/lib/query-keys";
import type { HcmWriteRequest } from "@/lib/hcm-types";

// Guard: suppress background polls while a write mutation is in-flight for this
// balance key. This prevents the poll from clobbering the optimistic update.
// After mutation settles, useSubmitRequest triggers an explicit re-fetch.
export function useBalance(employeeId: string, locationId: string) {
  const mutationsPending = useMutationState({
    filters: {
      status: "pending",
      predicate: (mutation) => {
        const vars = mutation.state.variables as HcmWriteRequest | undefined;
        return (
          vars?.employeeId === employeeId && vars?.locationId === locationId
        );
      },
    },
  });
  const isMutating = mutationsPending.length > 0;

  return useQuery({
    queryKey: queryKeys.balance(employeeId, locationId),
    queryFn: () => hcmClient.getBalance(employeeId, locationId),
    refetchInterval: isMutating ? false : 30000,
    staleTime: 0,
  });
}
