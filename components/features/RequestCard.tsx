'use client'

import { useState } from 'react'
import { useBalance } from '@/hooks/use-balance'
import { useApproveRequest, useDenyRequest, isBalanceStale } from '@/hooks/use-manager-actions'
import { BalanceFreshnessIndicator } from '@/components/ui/BalanceFreshnessIndicator'
import { LOCATIONS } from '@/mocks/seed'
import type { HcmPendingRequest } from '@/lib/hcm-types'

export interface RequestCardProps {
  request: HcmPendingRequest
}

export function RequestCard({ request }: RequestCardProps) {
  const { data: balance, isFetching } = useBalance(request.employeeId, request.locationId)
  const approveMutation = useApproveRequest()
  const denyMutation = useDenyRequest()
  const [settled, setSettled] = useState<'approved' | 'denied' | null>(null)

  const stale = isBalanceStale(balance?.asOf)
  // Disable action buttons while: balance is loading, balance is stale (ensureFreshBalance
  // inside the mutation will re-fetch, but we block here to show honest UI state), or an
  // action is already in-flight.
  const actionDisabled = isFetching || stale || approveMutation.isPending || denyMutation.isPending

  const locationName =
    LOCATIONS.find((l) => l.id === request.locationId)?.name ?? request.locationId

  function handleApprove() {
    approveMutation.mutate(
      { requestId: request.id, employeeId: request.employeeId, locationId: request.locationId },
      { onSuccess: () => setSettled('approved') },
    )
  }

  function handleDeny() {
    denyMutation.mutate(
      { requestId: request.id, employeeId: request.employeeId, locationId: request.locationId },
      { onSuccess: () => setSettled('denied') },
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-zinc-900">{request.employeeName}</p>
          <p className="text-sm text-zinc-500 mt-0.5">
            {Math.abs(request.delta)} days · {locationName}
          </p>
        </div>
        <span className="shrink-0 text-xs text-zinc-400">
          {new Date(request.submittedAt).toLocaleDateString()}
        </span>
      </div>

      {request.reason && (
        <p className="text-sm text-zinc-600 italic">"{request.reason}"</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-zinc-500">Current balance:</span>
        {balance ? (
          <span className="text-sm font-semibold text-zinc-900">
            {balance.balance} {balance.unit}
          </span>
        ) : (
          <span className="block w-16 h-4 bg-zinc-200 rounded animate-pulse" />
        )}
        <BalanceFreshnessIndicator
          asOf={balance?.asOf}
          isStale={stale}
          isFetching={isFetching}
        />
      </div>

      {settled ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            settled === 'approved'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}
        >
          {settled === 'approved' ? 'Approved' : 'Denied'}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={actionDisabled}
            className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {approveMutation.isPending ? 'Approving…' : 'Approve'}
          </button>
          <button
            onClick={handleDeny}
            disabled={actionDisabled}
            className="flex-1 rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {denyMutation.isPending ? 'Denying…' : 'Deny'}
          </button>
        </div>
      )}
    </div>
  )
}
