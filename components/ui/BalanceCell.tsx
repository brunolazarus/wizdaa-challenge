import type { HcmBalance } from '@/lib/hcm-types'

export interface BalanceCellProps {
  balance: HcmBalance | undefined
  isFetching: boolean
  justUpdated: boolean
}

export function BalanceCell({ balance, isFetching, justUpdated }: BalanceCellProps) {
  if (!balance) {
    return (
      <div className="flex items-center gap-2">
        <span className="block w-16 h-4 bg-zinc-200 rounded animate-pulse" />
        <span className="block w-10 h-4 bg-zinc-100 rounded animate-pulse" />
      </div>
    )
  }

  const ageMs = Date.now() - new Date(balance.asOf).getTime()
  const isStale = ageMs > 60_000

  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-lg font-semibold tabular-nums ${isStale ? 'text-amber-600' : 'text-zinc-900'}`}
      >
        {balance.balance} {balance.unit}
      </span>

      {isFetching && (
        <span className="text-xs text-zinc-400 animate-pulse">refreshing…</span>
      )}

      {justUpdated && !isFetching && (
        <span className="text-xs font-medium text-emerald-600">Balance updated</span>
      )}

      {isStale && !isFetching && !justUpdated && (
        <span className="text-xs text-amber-600">
          as of {new Date(balance.asOf).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
