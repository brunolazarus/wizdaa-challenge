import type { HcmBalance, HcmPendingRequest } from '@/lib/hcm-types'
import { SEED_BALANCES, SEED_REQUESTS, EMPLOYEES } from './seed'

export function storeKey(employeeId: string, locationId: string) {
  return `${employeeId}:${locationId}`
}

function createFreshStore(): Map<string, HcmBalance> {
  const map = new Map<string, HcmBalance>()
  for (const row of SEED_BALANCES) {
    map.set(storeKey(row.employeeId, row.locationId), {
      ...row,
      asOf: new Date().toISOString(),
    })
  }
  return map
}

// Persisted on globalThis so Next.js hot-reloads don't reset state in dev
const STORE_KEY = '__hcm_store__'

function resolveStore(): Map<string, HcmBalance> {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as Record<string, unknown>
    if (!g[STORE_KEY]) g[STORE_KEY] = createFreshStore()
    return g[STORE_KEY] as Map<string, HcmBalance>
  }
  return createFreshStore()
}

export function getStore(): Map<string, HcmBalance> {
  return resolveStore()
}

// Called in test beforeEach to guarantee a clean slate
export function resetStore(): void {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as Record<string, unknown>
    g[STORE_KEY] = createFreshStore()
    g[REQUEST_STORE_KEY] = createFreshRequestStore()
  }
}

// ─── Request store ─────────────────────────────────────────────────────────────

const REQUEST_STORE_KEY = '__hcm_request_store__'

function createFreshRequestStore(): Map<string, HcmPendingRequest> {
  const map = new Map<string, HcmPendingRequest>()
  for (const req of SEED_REQUESTS) {
    map.set(req.id, { ...req, submittedAt: new Date().toISOString() })
  }
  return map
}

function resolveRequestStore(): Map<string, HcmPendingRequest> {
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as Record<string, unknown>
    if (!g[REQUEST_STORE_KEY]) g[REQUEST_STORE_KEY] = createFreshRequestStore()
    return g[REQUEST_STORE_KEY] as Map<string, HcmPendingRequest>
  }
  return createFreshRequestStore()
}

export function getRequestStore(): Map<string, HcmPendingRequest> {
  return resolveRequestStore()
}

// Anniversary timer — dev/demo only, never runs in CI or browser
declare global {
  // eslint-disable-next-line no-var
  var __hcmAnniversaryTimer: ReturnType<typeof setInterval> | undefined
}

if (
  typeof process !== 'undefined' &&
  process.env.HCM_ANNIVERSARY_TIMER_ENABLED === 'true' &&
  !globalThis.__hcmAnniversaryTimer
) {
  globalThis.__hcmAnniversaryTimer = setInterval(() => {
    const employee = EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)]
    const store = getStore()
    for (const [key, balance] of store.entries()) {
      if (balance.employeeId === employee.id) {
        store.set(key, {
          ...balance,
          balance: balance.balance + 2,
          version: balance.version + 1,
          asOf: new Date().toISOString(),
        })
      }
    }
  }, 30_000)
}
