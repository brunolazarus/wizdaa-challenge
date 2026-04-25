'use client'

import { useEffect, useRef, useState } from 'react'
import { useBalance } from '@/hooks/use-balance'
import { BalanceCell } from '@/components/ui/BalanceCell'
import { LOCATIONS } from '@/mocks/seed'

function BalanceRow({
  employeeId,
  locationId,
  locationName,
}: {
  employeeId: string
  locationId: string
  locationName: string
}) {
  const { data, isFetching } = useBalance(employeeId, locationId)
  const prevVersionRef = useRef<number | undefined>(undefined)
  const [justUpdated, setJustUpdated] = useState(false)

  // Detect when a background poll lands a new version mid-session
  useEffect(() => {
    if (prevVersionRef.current !== undefined && data?.version !== prevVersionRef.current) {
      setJustUpdated(true)
      const t = setTimeout(() => setJustUpdated(false), 3000)
      return () => clearTimeout(t)
    }
    prevVersionRef.current = data?.version
  }, [data?.version])

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-3 pr-8 text-sm font-medium text-zinc-600">{locationName}</td>
      <td className="py-3">
        <BalanceCell balance={data} isFetching={isFetching} justUpdated={justUpdated} />
      </td>
    </tr>
  )
}

export interface BalanceTableProps {
  employeeId: string
}

export function BalanceTable({ employeeId }: BalanceTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-200">
          <th className="pb-2 pr-8 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Location
          </th>
          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Balance
          </th>
        </tr>
      </thead>
      <tbody>
        {LOCATIONS.map((loc) => (
          <BalanceRow
            key={loc.id}
            employeeId={employeeId}
            locationId={loc.id}
            locationName={loc.name}
          />
        ))}
      </tbody>
    </table>
  )
}
