import type {
  HcmBalance,
  HcmBalanceBatch,
  HcmErrorResponse,
  HcmWriteRequest,
} from '@/lib/hcm-types'
import { storeKey } from './store'

// ─── Failure injection ────────────────────────────────────────────────────────

export type ForceFailure = 'silent' | 'conflict' | 'timeout' | null

export function parseForceFailure(headers: Headers): ForceFailure {
  const val = headers.get('X-HCM-Force-Failure')
  if (val === 'silent' || val === 'conflict' || val === 'timeout') return val
  return null
}

// Returns true if this failure type should fire.
// When forceFailure is set, only that exact type fires — random rates are bypassed.
function shouldFail(
  forceFailure: ForceFailure,
  type: 'silent' | 'conflict' | 'timeout',
  rate: number,
): boolean {
  if (forceFailure !== null) return forceFailure === type
  return Math.random() < rate
}

// ─── Write result discriminated union ─────────────────────────────────────────

export type WriteResult =
  | { type: 'success'; balance: HcmBalance }
  | { type: 'silent';  balance: HcmBalance }   // 200 but version unchanged — client must detect
  | { type: 'conflict'; error: HcmErrorResponse }
  | { type: 'timeout' }
  | { type: 'rejected'; error: HcmErrorResponse }

// ─── Business logic ────────────────────────────────────────────────────────────

export function getBalance(
  store: Map<string, HcmBalance>,
  employeeId: string,
  locationId: string,
  forceFailure: ForceFailure = null,
): HcmBalance | null {
  const entry = store.get(storeKey(employeeId, locationId))
  if (!entry) return null

  // ~5% chance of returning a slightly stale value (simulates replica lag)
  if (shouldFail(forceFailure, 'silent', 0.05)) {
    return {
      ...entry,
      balance: entry.balance + 1,   // stale replica shows pre-deduction value
      version: Math.max(1, entry.version - 1),
    }
  }

  return entry
}

export function writeBalance(
  store: Map<string, HcmBalance>,
  req: HcmWriteRequest,
  forceFailure: ForceFailure = null,
): WriteResult {
  const key = storeKey(req.employeeId, req.locationId)
  const current = store.get(key)

  if (!current) {
    return {
      type: 'rejected',
      error: { code: 'NOT_FOUND', message: `No balance found for ${req.employeeId} at ${req.locationId}` },
    }
  }

  if (current.balance + req.delta < 0) {
    return {
      type: 'rejected',
      error: { code: 'INSUFFICIENT_BALANCE', message: `Insufficient balance: ${current.balance} available` },
    }
  }

  // Order matters: timeout checked first (most disruptive), then conflict, then silent
  if (shouldFail(forceFailure, 'timeout', 0.02)) return { type: 'timeout' }

  if (shouldFail(forceFailure, 'conflict', 0.10)) {
    return {
      type: 'conflict',
      error: { code: 'CONFLICT', message: 'Concurrent modification detected' },
    }
  }

  // Silent failure: return 200 but do not apply the write — version stays the same
  if (shouldFail(forceFailure, 'silent', 0.05)) {
    return { type: 'silent', balance: current }
  }

  const updated: HcmBalance = {
    ...current,
    balance: current.balance + req.delta,
    version: current.version + 1,
    asOf: new Date().toISOString(),
  }
  store.set(key, updated)
  return { type: 'success', balance: updated }
}

export function getBalances(store: Map<string, HcmBalance>): HcmBalanceBatch {
  return { rows: Array.from(store.values()) }
}

export function triggerAnniversaryBonus(
  store: Map<string, HcmBalance>,
  employeeId: string,
  bonusDays = 2,
): HcmBalance[] {
  const updated: HcmBalance[] = []
  for (const [key, balance] of store.entries()) {
    if (balance.employeeId === employeeId) {
      const next: HcmBalance = {
        ...balance,
        balance: balance.balance + bonusDays,
        version: balance.version + 1,
        asOf: new Date().toISOString(),
      }
      store.set(key, next)
      updated.push(next)
    }
  }
  return updated
}
