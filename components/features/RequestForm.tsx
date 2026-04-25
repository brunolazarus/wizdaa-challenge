'use client'

import { useState } from 'react'
import { useSubmitRequest } from '@/hooks/use-submit-request'
import { RequestStatusBanner } from '@/components/ui/RequestStatusBanner'
import { StaleDataWarning } from '@/components/ui/StaleDataWarning'
import { useBalance } from '@/hooks/use-balance'
import { LOCATIONS } from '@/mocks/seed'

export interface RequestFormProps {
  employeeId: string
}

export function RequestForm({ employeeId }: RequestFormProps) {
  const { submit, status, isPending, reset } = useSubmitRequest()

  const [locationId, setLocationId] = useState<string>(LOCATIONS[0].id)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // Track pre-submission balance for StaleDataWarning comparison
  const [preBalance, setPreBalance] = useState<{ balance: number; unit: string } | null>(null)
  const { data: currentBalance } = useBalance(employeeId, locationId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate || !currentBalance) return

    const days =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1

    setPreBalance({ balance: currentBalance.balance, unit: currentBalance.unit })
    submit({ employeeId, locationId, delta: -days, reason })
  }

  function handleReset() {
    reset()
    setPreBalance(null)
  }

  return (
    <div className="space-y-4">
      {status !== 'idle' && <RequestStatusBanner status={status} onReset={handleReset} />}

      {status === 'hcm-silently-wrong' && preBalance && currentBalance && (
        <StaleDataWarning
          preBalance={preBalance.balance - 1}
          postBalance={currentBalance.balance}
          unit={preBalance.unit}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isPending}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isPending}
              required
              min={startDate}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="Brief description of your time-off request…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !startDate || !endDate}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting…' : 'Request time off'}
        </button>
      </form>
    </div>
  )
}
