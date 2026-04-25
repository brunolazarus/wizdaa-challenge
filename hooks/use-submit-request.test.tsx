import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { queryKeys } from '@/lib/query-keys'
import { useSubmitRequest } from './use-submit-request'
import type { HcmBalance } from '@/lib/hcm-types'

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

const submitReq = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  delta: -3,
  reason: 'vacation',
}

function setup() {
  const queryClient = createTestClient()
  queryClient.setQueryData(queryKeys.balance('emp-alice', 'loc-nyc'), baseBalance)
  const wrapper = makeWrapper(queryClient)
  const { result } = renderHook(() => useSubmitRequest(), { wrapper })
  return { queryClient, result }
}

describe('useSubmitRequest — state machine', () => {
  it('applies optimistic update and enters optimistic-pending immediately', async () => {
    const { queryClient, result } = setup()

    // Hold POST indefinitely to observe the pending state
    server.use(http.post('/api/hcm/balance', () => new Promise(() => {})))

    act(() => { result.current.submit(submitReq) })

    // onMutate is async — wait for it to complete before asserting pending state
    await waitFor(() => expect(result.current.status).toBe('optimistic-pending'))
    expect(result.current.isPending).toBe(true)
    // Balance decremented optimistically
    expect(
      queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))?.balance,
    ).toBe(12)
  })

  it('transitions to hcm-confirmed when HCM 200 + version increments on re-fetch', async () => {
    const { queryClient, result } = setup()

    const confirmed: HcmBalance = { ...baseBalance, balance: 12, version: 2 }
    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json({ success: true, balance: confirmed }),
      ),
      http.get('/api/hcm/balance', () => HttpResponse.json(confirmed)),
    )

    act(() => { result.current.submit(submitReq) })

    await waitFor(() => expect(result.current.status).toBe('hcm-confirmed'), { timeout: 5000 })
    expect(queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))).toMatchObject({
      balance: 12,
      version: 2,
    })
  })

  it('transitions to hcm-silently-wrong and rolls back when HCM 200 but version unchanged', async () => {
    const { queryClient, result } = setup()

    // POST returns 200 but balance is unchanged — HCM silent failure
    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json({ success: true, balance: baseBalance }),
      ),
      http.get('/api/hcm/balance', () => HttpResponse.json(baseBalance)),
    )

    act(() => { result.current.submit(submitReq) })

    await waitFor(() => expect(result.current.status).toBe('hcm-silently-wrong'), { timeout: 5000 })
    // Balance rolled back to pre-mutation value
    expect(
      queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))?.balance,
    ).toBe(15)
  })

  it('transitions to hcm-rejected and rolls back on HCM 422', async () => {
    const { queryClient, result } = setup()

    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json(
          { code: 'INSUFFICIENT_BALANCE', message: 'Not enough balance' },
          { status: 422 },
        ),
      ),
    )

    act(() => { result.current.submit(submitReq) })

    await waitFor(() => expect(result.current.status).toBe('hcm-rejected'), { timeout: 5000 })
    expect(
      queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))?.balance,
    ).toBe(15)
  })

  it('transitions to hcm-conflict and rolls back on HCM 409', async () => {
    const { queryClient, result } = setup()

    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json(
          { code: 'CONFLICT', message: 'Write conflict — retry with latest version' },
          { status: 409 },
        ),
      ),
    )

    act(() => { result.current.submit(submitReq) })

    await waitFor(() => expect(result.current.status).toBe('hcm-conflict'), { timeout: 5000 })
    expect(
      queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))?.balance,
    ).toBe(15)
  })

  it('transitions to optimistic-rolled-back and rolls back on non-4xx error (e.g. 504)', async () => {
    const { queryClient, result } = setup()

    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json({ code: 'REJECTED', message: 'Request timed out' }, { status: 504 }),
      ),
    )

    act(() => { result.current.submit(submitReq) })

    await waitFor(() => expect(result.current.status).toBe('optimistic-rolled-back'), { timeout: 5000 })
    expect(
      queryClient.getQueryData<HcmBalance>(queryKeys.balance('emp-alice', 'loc-nyc'))?.balance,
    ).toBe(15)
  })

  it('reset() returns status to idle after a terminal state', async () => {
    const { result } = setup()

    server.use(
      http.post('/api/hcm/balance', () =>
        HttpResponse.json({ code: 'CONFLICT', message: 'conflict' }, { status: 409 }),
      ),
    )

    act(() => { result.current.submit(submitReq) })
    await waitFor(() => expect(result.current.status).toBe('hcm-conflict'))

    act(() => { result.current.reset() })
    expect(result.current.status).toBe('idle')
  })
})
