"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hcmClient } from "@/lib/hcm-client";
import { queryKeys } from "@/lib/query-keys";
import type { HcmBalance } from "@/lib/hcm-types";

export const MANAGER_STALENESS_THRESHOLD_MS = 60_000;

export function isBalanceStale(asOf: string | undefined): boolean {
  if (!asOf) return true;
  return Date.now() - new Date(asOf).getTime() > MANAGER_STALENESS_THRESHOLD_MS;
}

// Ensures the balance for a given employee+location is fresher than the staleness threshold.
// Triggers a blocking re-fetch from primary if stale. This runs inside the mutation to
// guarantee the manager is acting on current data at the exact moment of decision.
async function ensureFreshBalance(
  queryClient: ReturnType<typeof useQueryClient>,
  employeeId: string,
  locationId: string,
): Promise<HcmBalance> {
  const cached = queryClient.getQueryData<HcmBalance>(
    queryKeys.balance(employeeId, locationId),
  );
  if (!cached || isBalanceStale(cached.asOf)) {
    return queryClient.fetchQuery({
      queryKey: queryKeys.balance(employeeId, locationId),
      queryFn: () => hcmClient.getBalance(employeeId, locationId),
      staleTime: 0,
    });
  }
  return cached;
}

interface ApproveVars {
  requestId: string;
  employeeId: string;
  locationId: string;
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, employeeId, locationId }: ApproveVars) => {
      await ensureFreshBalance(queryClient, employeeId, locationId);
      return hcmClient.approveRequest(requestId);
    },
    onSuccess: (_data, { employeeId, locationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.balance(employeeId, locationId),
      });
    },
  });
}

interface DenyVars {
  requestId: string;
  employeeId: string;
  locationId: string;
}

export function useDenyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, employeeId, locationId }: DenyVars) => {
      await ensureFreshBalance(queryClient, employeeId, locationId);
      return hcmClient.denyRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() });
    },
  });
}
