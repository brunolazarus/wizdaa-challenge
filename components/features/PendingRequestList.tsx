'use client'

import { useRequests } from '@/hooks/use-requests'
import { RequestCard } from './RequestCard'

export function PendingRequestList() {
  const { data: requests, isLoading } = useRequests()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 h-28 animate-pulse"
          />
        ))}
      </div>
    )
  }

  const pending = requests?.filter((r) => r.status === 'pending') ?? []

  if (pending.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
