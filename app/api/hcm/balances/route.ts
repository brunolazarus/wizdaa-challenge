import { NextResponse } from 'next/server'
import { getStore } from '@/mocks/store'
import { getBalances } from '@/mocks/hcm-logic'

export async function GET() {
  return NextResponse.json(getBalances(getStore()))
}
