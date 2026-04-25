import { http, HttpResponse, delay } from 'msw'
import type { HcmWriteRequest, HcmAnniversaryBonusRequest } from '@/lib/hcm-types'
import { getStore, getRequestStore } from './store'
import {
  parseForceFailure,
  getBalance,
  writeBalance,
  getBalances,
  getRequests,
  approveRequest,
  denyRequest,
  triggerAnniversaryBonus,
} from './hcm-logic'

export const handlers = [
  // Per-cell balance read — authoritative source for a single [employeeId, locationId]
  http.get('/api/hcm/balance', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId') ?? ''
    const locationId = url.searchParams.get('locationId') ?? ''
    const forceFailure = parseForceFailure(request.headers)

    const balance = getBalance(getStore(), employeeId, locationId, forceFailure)

    if (!balance) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: `No balance for ${employeeId} at ${locationId}` },
        { status: 404 },
      )
    }

    return HttpResponse.json(balance)
  }),

  // Balance write — apply a delta; may silently fail, conflict, or timeout
  http.post('/api/hcm/balance', async ({ request }) => {
    const body = (await request.json()) as HcmWriteRequest
    const forceFailure = parseForceFailure(request.headers)

    const result = writeBalance(getStore(), body, forceFailure)

    if (result.type === 'timeout') {
      await delay(10_000)
      return HttpResponse.json(
        { code: 'REJECTED', message: 'Request timed out' },
        { status: 504 },
      )
    }

    if (result.type === 'conflict') {
      return HttpResponse.json(result.error, { status: 409 })
    }

    if (result.type === 'rejected') {
      return HttpResponse.json(result.error, { status: 422 })
    }

    // Both 'success' and 'silent' return 200 — the client MUST verify version changed
    return HttpResponse.json({ success: true, balance: result.balance })
  }),

  // Batch corpus — used for initial hydration only
  http.get('/api/hcm/balances', () => {
    return HttpResponse.json(getBalances(getStore()))
  }),

  // Manual anniversary bonus trigger — used by tests and dev tooling
  http.post('/api/hcm/anniversary-bonus', async ({ request }) => {
    const body = (await request.json()) as HcmAnniversaryBonusRequest
    const balances = triggerAnniversaryBonus(getStore(), body.employeeId)
    return HttpResponse.json({ balances })
  }),

  // Pending requests list — manager view
  http.get('/api/hcm/requests', () => {
    return HttpResponse.json({ requests: getRequests(getRequestStore()) })
  }),

  // Approve a request — applies balance delta, marks request approved
  http.post('/api/hcm/requests/:id/approve', ({ params }) => {
    const result = approveRequest(getStore(), getRequestStore(), params.id as string)
    if (result.type === 'not_found') {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Request not found' }, { status: 404 })
    }
    if (result.type === 'already_settled') {
      return HttpResponse.json({ code: 'CONFLICT', message: `Request already ${result.status}` }, { status: 409 })
    }
    if (result.type === 'insufficient_balance') {
      return HttpResponse.json(result.error, { status: 422 })
    }
    return HttpResponse.json(result.response)
  }),

  // Deny a request — marks denied, no balance change
  http.post('/api/hcm/requests/:id/deny', ({ params }) => {
    const result = denyRequest(getRequestStore(), params.id as string)
    if (result.type === 'not_found') {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Request not found' }, { status: 404 })
    }
    if (result.type === 'already_settled') {
      return HttpResponse.json({ code: 'CONFLICT', message: `Request already ${result.status}` }, { status: 409 })
    }
    return HttpResponse.json(result.response)
  }),
]
