'use client'

import { useUser } from '@/contexts/UserContext'
import { PendingRequestList } from '@/components/features/PendingRequestList'

export default function ManagerPage() {
  const { name } = useUser()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Time-Off Requests</h1>
        <p className="text-sm text-zinc-500 mt-1">{name}</p>
      </div>

      <section aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="text-base font-semibold text-zinc-700 mb-4">
          Pending requests
        </h2>
        <PendingRequestList />
      </section>
    </div>
  )
}
