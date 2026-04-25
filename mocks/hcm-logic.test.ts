import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resetStore, getStore, storeKey } from './store'
import {
  getBalance,
  writeBalance,
  getBalances,
  triggerAnniversaryBonus,
  parseForceFailure,
} from './hcm-logic'

// Read directly from the store map — bypasses getBalance's random silent failure.
// Use this when a test wants to assert exact stored state, not getBalance's behaviour.
const stored = (empId: string, locId: string) =>
  getStore().get(storeKey(empId, locId))

beforeEach(() => resetStore())
afterEach(() => vi.restoreAllMocks())

describe('parseForceFailure', () => {
  it('returns null when header is absent', () => {
    expect(parseForceFailure(new Headers())).toBeNull()
  })

  it.each(['silent', 'conflict', 'timeout'] as const)('parses "%s"', (val) => {
    expect(parseForceFailure(new Headers({ 'X-HCM-Force-Failure': val }))).toBe(val)
  })

  it('returns null for unknown values', () => {
    expect(parseForceFailure(new Headers({ 'X-HCM-Force-Failure': 'boom' }))).toBeNull()
  })
})

describe('getBalance', () => {
  it('returns the correct shape for a known employee+location', () => {
    // Use forceFailure='conflict' to disable the 5% random silent check
    // (shouldFail returns false for any type != 'conflict' when forceFailure='conflict')
    const result = getBalance(getStore(), 'emp-alice', 'loc-nyc', 'conflict')
    expect(result).toMatchObject({ employeeId: 'emp-alice', locationId: 'loc-nyc', balance: 15, version: 1 })
  })

  it('returns null for unknown employee', () => {
    expect(getBalance(getStore(), 'emp-unknown', 'loc-nyc', null)).toBeNull()
  })

  it('simulates stale replica data when forced silent', () => {
    const seed = stored('emp-alice', 'loc-nyc')!
    const stale = getBalance(getStore(), 'emp-alice', 'loc-nyc', 'silent')!
    expect(stale.version).toBeLessThan(seed.version + 1)
    expect(stale.balance).toBeGreaterThan(seed.balance) // stale shows pre-deduction value
  })
})

describe('writeBalance', () => {
  it('applies delta and increments version on success', () => {
    // Pin random above all failure thresholds (10% conflict, 5% silent, 2% timeout)
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const result = writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, null)

    expect(result.type).toBe('success')
    if (result.type !== 'success') return

    expect(result.balance.balance).toBe(12)
    expect(result.balance.version).toBe(2)

    // Read directly from store — bypasses getBalance's 5% random silent failure
    const afterWrite = stored('emp-alice', 'loc-nyc')
    expect(afterWrite?.version).toBe(2)
    expect(afterWrite?.balance).toBe(12)
  })

  it('returns silent — version and balance unchanged — when forced', () => {
    const before = getBalance(getStore(), 'emp-alice', 'loc-nyc', null)!

    const result = writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, 'silent')

    expect(result.type).toBe('silent')
    if (result.type !== 'silent') return

    // Balance and version are unchanged — this is how the client detects silent failure
    expect(result.balance.version).toBe(before.version)
    expect(result.balance.balance).toBe(before.balance)

    // Store is also unchanged
    const stored = getBalance(getStore(), 'emp-alice', 'loc-nyc', null)
    expect(stored?.version).toBe(before.version)
  })

  it('returns conflict when forced', () => {
    const result = writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, 'conflict')

    expect(result.type).toBe('conflict')
    if (result.type !== 'conflict') return
    expect(result.error.code).toBe('CONFLICT')
  })

  it('returns timeout when forced', () => {
    const result = writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, 'timeout')

    expect(result.type).toBe('timeout')
  })

  it('rejects when balance is insufficient', () => {
    const result = writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -999,
      reason: 'vacation',
    }, null)

    expect(result.type).toBe('rejected')
    if (result.type !== 'rejected') return
    expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
  })

  it('rejects for unknown employee', () => {
    const result = writeBalance(getStore(), {
      employeeId: 'emp-unknown',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, null)

    expect(result.type).toBe('rejected')
    if (result.type !== 'rejected') return
    expect(result.error.code).toBe('NOT_FOUND')
  })
})

describe('getBalances', () => {
  it('returns all 6 seed rows', () => {
    const { rows } = getBalances(getStore())
    expect(rows).toHaveLength(6)
  })

  it('reflects mutations', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    writeBalance(getStore(), {
      employeeId: 'emp-alice',
      locationId: 'loc-nyc',
      delta: -3,
      reason: 'vacation',
    }, null)

    const { rows } = getBalances(getStore())
    const alice = rows.find(r => r.employeeId === 'emp-alice' && r.locationId === 'loc-nyc')
    expect(alice?.balance).toBe(12)
    expect(alice?.version).toBe(2)
  })
})

describe('triggerAnniversaryBonus', () => {
  it('adds bonus days to all locations for the employee', () => {
    const updated = triggerAnniversaryBonus(getStore(), 'emp-alice', 2)

    expect(updated).toHaveLength(2) // 2 locations
    for (const row of updated) {
      expect(row.employeeId).toBe('emp-alice')
      expect(row.version).toBe(2) // incremented
    }

    expect(updated.find(r => r.locationId === 'loc-nyc')?.balance).toBe(17)
    expect(updated.find(r => r.locationId === 'loc-lon')?.balance).toBe(7)
  })

  it('does not affect other employees', () => {
    triggerAnniversaryBonus(getStore(), 'emp-alice', 2)

    const bob = stored('emp-bob', 'loc-nyc')
    expect(bob?.balance).toBe(10) // unchanged
    expect(bob?.version).toBe(1)  // unchanged
  })

  it('returns empty array for unknown employee', () => {
    const result = triggerAnniversaryBonus(getStore(), 'emp-unknown', 2)
    expect(result).toHaveLength(0)
  })
})
