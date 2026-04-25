import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/mocks/store'
import { triggerAnniversaryBonus } from '@/mocks/hcm-logic'
import type { HcmAnniversaryBonusRequest } from '@/lib/hcm-types'

export async function POST(request: NextRequest) {
  const { employeeId } = (await request.json()) as HcmAnniversaryBonusRequest
  const balances = triggerAnniversaryBonus(getStore(), employeeId)
  return NextResponse.json({ balances })
}
