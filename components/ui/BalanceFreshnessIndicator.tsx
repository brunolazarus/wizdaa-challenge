export interface BalanceFreshnessIndicatorProps {
  asOf: string | undefined
  isStale: boolean
  isFetching: boolean
}

export function BalanceFreshnessIndicator({ asOf, isStale, isFetching }: BalanceFreshnessIndicatorProps) {
  if (isFetching) {
    return <span className="text-xs text-zinc-400 animate-pulse">Refreshing balance…</span>
  }

  if (!asOf) {
    return <span className="text-xs text-amber-600">Balance unavailable</span>
  }

  if (isStale) {
    return (
      <span className="text-xs font-medium text-amber-700">
        ⚠ Data may be outdated
      </span>
    )
  }

  return (
    <span className="text-xs text-zinc-400">
      as of {new Date(asOf).toLocaleTimeString()}
    </span>
  )
}
