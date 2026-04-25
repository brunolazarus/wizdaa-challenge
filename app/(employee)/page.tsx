'use client'

import { useUser } from '@/contexts/UserContext'
import { BalanceTable } from '@/components/features/BalanceTable'
import { RequestForm } from '@/components/features/RequestForm'

export default function EmployeePage() {
  const { employeeId, name } = useUser()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Time Off</h1>
        <p className="text-sm text-zinc-500 mt-1">{name}</p>
      </div>

      <section aria-labelledby="balances-heading">
        <h2 id="balances-heading" className="text-base font-semibold text-zinc-700 mb-4">
          Your balances
        </h2>
        <BalanceTable employeeId={employeeId} />
      </section>

      <section aria-labelledby="request-heading">
        <h2 id="request-heading" className="text-base font-semibold text-zinc-700 mb-4">
          Request time off
        </h2>
        <RequestForm employeeId={employeeId} />
      </section>
    </div>
  )
}
