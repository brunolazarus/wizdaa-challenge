'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hcmClient, HcmRequestError } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'
import type { HcmBalance, HcmWriteRequest, HcmWriteResponse, RequestStatus } from '@/lib/hcm-types'

type TerminalStatus = Exclude<RequestStatus, 'idle' | 'optimistic-pending'>

export function useSubmitRequest() {
  const queryClient = useQueryClient()

  // optimistic-pending is derived from mutation.isPending (TRD §2.5 — never stored separately)
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | 'idle'>('idle')

  const mutation = useMutation<
    HcmWriteResponse,
    HcmRequestError,
    HcmWriteRequest,
    { snapshot: HcmBalance | undefined; preVersion: number | undefined }
  >({
    mutationFn: (req) => hcmClient.writeBalance(req),

    onMutate: async (req) => {
      const key = queryKeys.balance(req.employeeId, req.locationId)
      // Cancel any in-flight queries to prevent a poll from overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: key })
      const snapshot = queryClient.getQueryData<HcmBalance>(key)
      queryClient.setQueryData<HcmBalance>(key, (old) =>
        old ? { ...old, balance: old.balance + req.delta } : old,
      )
      return { snapshot, preVersion: snapshot?.version }
    },

    onError: (err, req, context) => {
      // Roll back the optimistic balance update before setting terminal state
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(queryKeys.balance(req.employeeId, req.locationId), context.snapshot)
      }
      if (err.status === 409) setTerminalStatus('hcm-conflict')
      else if (err.status === 422) setTerminalStatus('hcm-rejected')
      else setTerminalStatus('optimistic-rolled-back')
    },

    onSuccess: async (_data, req, context) => {
      const key = queryKeys.balance(req.employeeId, req.locationId)

      // Read-after-write verification (TRD §2.3): force fresh fetch from primary.
      // A 200 from HCM is not sufficient — HCM can return 200 with no write applied.
      const refreshed = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => hcmClient.getBalance(req.employeeId, req.locationId),
        staleTime: 0,
      })

      if (refreshed.version === context?.preVersion) {
        // HCM returned 200 but version did not increment — silent failure
        queryClient.setQueryData(key, context?.snapshot)
        setTerminalStatus('hcm-silently-wrong')
      } else {
        setTerminalStatus('hcm-confirmed')
      }
    },
  })

  const status: RequestStatus = mutation.isPending ? 'optimistic-pending' : terminalStatus

  return {
    submit: mutation.mutate,
    status,
    isPending: mutation.isPending,
    reset: () => {
      mutation.reset()
      setTerminalStatus('idle')
    },
  }
}
