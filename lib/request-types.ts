import type { RequestStatus } from './hcm-types'

export interface TimeOffRequest {
  id: string
  employeeId: string
  locationId: string
  delta: number           // negative for consumption
  reason: string
  status: RequestStatus
  processing: boolean     // true while verified flow is in-flight — no downstream read acts on this
  submittedAt: string     // ISO 8601
  preVersion: number | null
}
