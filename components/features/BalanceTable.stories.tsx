import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { BalanceTable } from './BalanceTable'

const now = new Date().toISOString()
const staleAsOf = new Date(Date.now() - 90_000).toISOString()

const aliceNyc = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  balance: 15,
  unit: 'days',
  asOf: now,
  version: 1,
}

const aliceLon = {
  employeeId: 'emp-alice',
  locationId: 'loc-lon',
  balance: 5,
  unit: 'days',
  asOf: now,
  version: 1,
}

const defaultHandlers = [
  http.get('/api/hcm/balance', ({ request }) => {
    const url = new URL(request.url)
    const locationId = url.searchParams.get('locationId')
    return HttpResponse.json(locationId === 'loc-nyc' ? aliceNyc : aliceLon)
  }),
]

const meta: Meta<typeof BalanceTable> = {
  component: BalanceTable,
  tags: ['autodocs'],
  argTypes: {
    employeeId: { control: 'text', description: 'Employee whose balances to display' },
  },
}

export default meta
type Story = StoryObj<typeof BalanceTable>

export const Default: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: { msw: { handlers: defaultHandlers } },
}

export const Loading: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', async () => {
          await delay('infinite')
        }),
      ],
    },
  },
}

export const Empty: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', () =>
          HttpResponse.json({ code: 'NOT_FOUND', message: 'No balance found' }, { status: 404 }),
        ),
      ],
    },
  },
}

export const Stale: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', ({ request }) => {
          const url = new URL(request.url)
          const locationId = url.searchParams.get('locationId')
          const row = locationId === 'loc-nyc' ? aliceNyc : aliceLon
          return HttpResponse.json({ ...row, asOf: staleAsOf })
        }),
      ],
    },
  },
}

// Simulates an anniversary bonus landing while the user is viewing the table.
// Uses a counter so the second poll returns an incremented version.
export const BalanceRefreshedMidSession: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: (() => {
        let callCount = 0
        return [
          http.get('/api/hcm/balance', ({ request }) => {
            callCount++
            const url = new URL(request.url)
            const locationId = url.searchParams.get('locationId')
            const base = locationId === 'loc-nyc' ? aliceNyc : aliceLon
            // Second call simulates a balance change from a background HCM mutation
            return HttpResponse.json(
              callCount > 1 ? { ...base, balance: base.balance + 3, version: 2 } : base,
            )
          }),
        ]
      })(),
    },
  },
}
