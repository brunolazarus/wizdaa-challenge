"use client";

import { useQuery } from "@tanstack/react-query";
import { hcmClient } from "@/lib/hcm-client";
import { queryKeys } from "@/lib/query-keys";

export function useRequests() {
  return useQuery({
    queryKey: queryKeys.requests(),
    queryFn: async () => {
      const res = await hcmClient.getRequests();
      return res.requests;
    },
    refetchInterval: 15_000,
    staleTime: 0,
  });
}
