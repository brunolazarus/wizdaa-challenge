import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { queryKeys } from '@/lib/query-keys'
import { useBalance } from './use-balance'
import { useSubmitRequest } from './use-submit-request'
import type { HcmBalance } from '@/lib/hcm-types'

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const baseBalance: HcmBalance = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  balance: 15,
  unit: 'days',
  asOf: new Date().toISOString(),
  version: 1,
}

afterEach(() => {
  vi.useRealTimers()
})

/**
 * Required Test A (TRD §2.4):
 * Background poll fires while mutation is in-flight → poll suppressed → mutation
 * settles → reconcile re-fetch confirms correct balance.
 */
describe('Required Test A — poll suppressed while mutation is in-flight', () => {
  it('holds optimistic balance when background poll fires during mutation, confirms after settlement', async () => {
    vi.useFakeTimers()

    const queryClient = createTestClient()
    const wrapper = makeWrapper(queryClient)

    queryClient.setQueryData(queryKeys.balance('emp-alice', 'loc-nyc'), baseBalance)

    // POST hangs until we release it
    let resolvePost!: (res: Response) => void
    server.use(
      http.post('/api/hcm/balance', () =>
        new Promise<Response>((r) => { resolvePost = r }),
      ),
      // GET returns original value — HCM hasn't applied the write yet
      http.get('/api/hcm/balance', () => HttpResponse.json(baseBalance)),
    )

    const { result } = renderHook(
      () => ({
        balance: useBalance('emp-alice', 'loc-nyc'),
        submit: useSubmitRequest(),
      }),
      { wrapper },
    )

    // Step 2: submit — onMutate is async (awaits cancelQueries), so we need to flush
    act(() => {
      result.current.submit.submit({
        employeeId: 'emp-alice',
        locationId: 'loc-nyc',
        delta: -3,
        reason: 'vacation',
      })
    })

    // Flush async onMutate (cancelQueries + setQueryData) without advancing timers
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })

    // isMutating is now true, optimistic update applied: balance = 12
    expect(result.current.balance.data?.balance).toBe(12)
    expect(result.current.submit.status).toBe('optimistic-pending')

    // Step 3-4: advance 31s — refetchInterval is false (isMutating guard active), poll is suppressed
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000)
    })

    // Balance still at optimistic 12 — poll did not overwrite cache
    expect(result.current.balance.data?.balance).toBe(12)

    // Switch to real timers before resolving the async mutation chain
    vi.useRealTimers()

    // Step 5: resolve the POST — HCM confirms the write (version incremented)
    const confirmed: HcmBalance = { ...baseBalance, balance: 12, version: 2 }
    server.use(http.get('/api/hcm/balance', () => HttpResponse.json(confirmed)))
    resolvePost(HttpResponse.json({ success: true, balance: confirmed }) as unknown as Response)

    // Step 6: reconcile re-fetch fires and confirms balance at 12
    await waitFor(() => expect(result.current.submit.status).toBe('hcm-confirmed'), { timeout: 5000 })
    expect(result.current.balance.data?.balance).toBe(12)
  })
})

/**
 * Required Test B (TRD §2.4):
 * Background poll fires with no mutation in-flight → balance updates.
 * No page reload required.
 */
describe('Required Test B — poll lands cleanly when no mutation in-flight', () => {
  it('updates balance when poll returns new value from HCM', async () => {
    vi.useFakeTimers()

    const queryClient = createTestClient()
    const wrapper = makeWrapper(queryClient)

    queryClient.setQueryData(queryKeys.balance('emp-alice', 'loc-nyc'), baseBalance)

    // HCM applied an anniversary bonus externally — poll will return 17
    const afterBonus: HcmBalance = {
      ...baseBalance,
      balance: 17,
      version: 2,
      asOf: new Date().toISOString(),
    }
    server.use(http.get('/api/hcm/balance', () => HttpResponse.json(afterBonus)))

    const { result } = renderHook(
      () => useBalance('emp-alice', 'loc-nyc'),
      { wrapper },
    )

    // Step 1: initial value from cache
    expect(result.current.data?.balance).toBe(15)

    // Step 2-3: advance past 30s — poll fires, no mutation in-flight
    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000)
    })

    // Step 4: balance updated to 17 — no page reload required
    expect(result.current.data?.balance).toBe(17)
    expect(result.current.data?.version).toBe(2)
  })
})
