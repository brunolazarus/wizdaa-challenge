import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/mocks/store'
import { parseForceFailure, getBalance, writeBalance } from '@/mocks/hcm-logic'
import type { HcmWriteRequest } from '@/lib/hcm-types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId') ?? ''
  const locationId = searchParams.get('locationId') ?? ''
  const forceFailure = parseForceFailure(request.headers)

  const balance = getBalance(getStore(), employeeId, locationId, forceFailure)

  if (!balance) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: `No balance for ${employeeId} at ${locationId}` },
      { status: 404 },
    )
  }

  return NextResponse.json(balance)
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HcmWriteRequest
  const forceFailure = parseForceFailure(request.headers)

  const result = writeBalance(getStore(), body, forceFailure)

  if (result.type === 'timeout') {
    await new Promise(resolve => setTimeout(resolve, 10_000))
    return NextResponse.json(
      { code: 'REJECTED', message: 'Request timed out' },
      { status: 504 },
    )
  }

  if (result.type === 'conflict') {
    return NextResponse.json(result.error, { status: 409 })
  }

  if (result.type === 'rejected') {
    return NextResponse.json(result.error, { status: 422 })
  }

  return NextResponse.json({ success: true, balance: result.balance })
}
