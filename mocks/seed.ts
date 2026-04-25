import type { HcmBalance, HcmPendingRequest } from '@/lib/hcm-types'

export const EMPLOYEES = [
  { id: 'emp-alice', name: 'Alice Johnson' },
  { id: 'emp-bob', name: 'Bob Martinez' },
  { id: 'emp-carol', name: 'Carol Chen' },
] as const

export const LOCATIONS = [
  { id: 'loc-nyc', name: 'New York' },
  { id: 'loc-lon', name: 'London' },
] as const

export type EmployeeId = (typeof EMPLOYEES)[number]['id']
export type LocationId = (typeof LOCATIONS)[number]['id']

// Deterministic — no randomness. Tests get consistent starting state.
// submittedAt is intentionally relative so the staleness indicator behaves
// realistically in dev — but for tests, resetStore() re-seeds with current time.
export const SEED_REQUESTS: Omit<HcmPendingRequest, 'submittedAt'>[] = [
  {
    id: 'req-001',
    employeeId: 'emp-alice',
    employeeName: 'Alice Johnson',
    locationId: 'loc-nyc',
    delta: -3,
    reason: 'Family vacation',
    status: 'pending',
  },
  {
    id: 'req-002',
    employeeId: 'emp-bob',
    employeeName: 'Bob Martinez',
    locationId: 'loc-lon',
    delta: -5,
    reason: 'Medical appointment',
    status: 'pending',
  },
  {
    id: 'req-003',
    employeeId: 'emp-carol',
    employeeName: 'Carol Chen',
    locationId: 'loc-nyc',
    delta: -2,
    reason: 'Personal day',
    status: 'pending',
  },
]

export const SEED_BALANCES: Omit<HcmBalance, 'asOf'>[] = [
  { employeeId: 'emp-alice', locationId: 'loc-nyc', balance: 15, unit: 'days', version: 1 },
  { employeeId: 'emp-alice', locationId: 'loc-lon', balance: 5,  unit: 'days', version: 1 },
  { employeeId: 'emp-bob',   locationId: 'loc-nyc', balance: 10, unit: 'days', version: 1 },
  { employeeId: 'emp-bob',   locationId: 'loc-lon', balance: 8,  unit: 'days', version: 1 },
  { employeeId: 'emp-carol', locationId: 'loc-nyc', balance: 20, unit: 'days', version: 1 },
  { employeeId: 'emp-carol', locationId: 'loc-lon', balance: 12, unit: 'days', version: 1 },
]
