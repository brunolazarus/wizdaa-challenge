export type HcmUnit = 'days' | 'hours'

export type HcmErrorCode =
  | 'CONFLICT'
  | 'REJECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'NOT_FOUND'

export type RequestStatus =
  | 'idle'
  | 'optimistic-pending'
  | 'hcm-confirmed'
  | 'hcm-rejected'
  | 'hcm-conflict'
  | 'hcm-silently-wrong'
  | 'optimistic-rolled-back'

export interface HcmBalance {
  employeeId: string
  locationId: string
  balance: number
  unit: HcmUnit
  asOf: string        // ISO 8601
  version: number     // monotonic integer — incremented on every successful write
}

export interface HcmBalanceBatch {
  rows: HcmBalance[]
}

export interface HcmWriteRequest {
  employeeId: string
  locationId: string
  delta: number       // negative for time-off consumption
  reason: string
}

export interface HcmWriteResponse {
  success: boolean
  balance: HcmBalance
}

export interface HcmErrorResponse {
  code: HcmErrorCode
  message: string
}

export interface HcmAnniversaryBonusRequest {
  employeeId: string
}

export interface HcmAnniversaryBonusResponse {
  balances: HcmBalance[]
}

export interface HcmPendingRequest {
  id: string
  employeeId: string
  employeeName: string
  locationId: string
  delta: number       // negative for consumption
  reason: string
  submittedAt: string // ISO 8601
  status: 'pending' | 'approved' | 'denied'
}

export interface HcmRequestsResponse {
  requests: HcmPendingRequest[]
}

export interface HcmApproveResponse {
  requestId: string
  status: 'approved'
  balance: HcmBalance
}

export interface HcmDenyResponse {
  requestId: string
  status: 'denied'
}
