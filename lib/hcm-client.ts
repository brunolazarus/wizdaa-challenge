import type {
  HcmBalance,
  HcmBalanceBatch,
  HcmWriteRequest,
  HcmWriteResponse,
  HcmAnniversaryBonusRequest,
  HcmAnniversaryBonusResponse,
  HcmErrorCode,
} from './hcm-types'

export class HcmRequestError extends Error {
  status: number
  code: HcmErrorCode | undefined

  constructor(message: string, status: number, code?: HcmErrorCode) {
    super(message)
    this.name = 'HcmRequestError'
    this.status = status
    this.code = code
  }
}

const BASE = '/api/hcm'

async function hcmFetch<T>(
  path: string,
  init?: RequestInit,
  forceFailure?: 'silent' | 'conflict' | 'timeout',
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }

  if (forceFailure) {
    headers['X-HCM-Force-Failure'] = forceFailure
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new HcmRequestError(body.message ?? res.statusText, res.status, body.code)
  }

  return res.json() as Promise<T>
}

export const hcmClient = {
  getBalance: (employeeId: string, locationId: string) =>
    hcmFetch<HcmBalance>(
      `/balance?employeeId=${employeeId}&locationId=${locationId}`,
    ),

  getBalances: () =>
    hcmFetch<HcmBalanceBatch>('/balances'),

  writeBalance: (body: HcmWriteRequest) =>
    hcmFetch<HcmWriteResponse>('/balance', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  triggerAnniversaryBonus: (body: HcmAnniversaryBonusRequest) =>
    hcmFetch<HcmAnniversaryBonusResponse>('/anniversary-bonus', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
