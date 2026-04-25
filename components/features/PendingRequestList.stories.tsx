import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { PendingRequestList } from './PendingRequestList'

const now = new Date().toISOString()

const mockRequests = [
  {
    id: 'req-001',
    employeeId: 'emp-alice',
    employeeName: 'Alice Johnson',
    locationId: 'loc-nyc',
    delta: -3,
    reason: 'Family vacation',
    submittedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    status: 'pending',
  },
  {
    id: 'req-002',
    employeeId: 'emp-bob',
    employeeName: 'Bob Martinez',
    locationId: 'loc-lon',
    delta: -5,
    reason: 'Medical appointment',
    submittedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    status: 'pending',
  },
]

const balanceHandlers = [
  http.get('/api/hcm/balance', ({ request }) => {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const locationId = url.searchParams.get('locationId')
    return HttpResponse.json({
      employeeId,
      locationId,
      balance: employeeId === 'emp-alice' ? 15 : 10,
      unit: 'days',
      asOf: now,
      version: 1,
    })
  }),
]

const meta: Meta<typeof PendingRequestList> = {
  component: PendingRequestList,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PendingRequestList>

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/requests', async () => {
          await delay('infinite')
        }),
      ],
    },
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/requests', () =>
          HttpResponse.json({ requests: [] }),
        ),
      ],
    },
  },
}

export const WithRequests: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/requests', () =>
          HttpResponse.json({ requests: mockRequests }),
        ),
        ...balanceHandlers,
        http.post('/api/hcm/requests/:id/approve', ({ params }) =>
          HttpResponse.json({
            requestId: params.id,
            status: 'approved',
            balance: {
              employeeId: 'emp-alice',
              locationId: 'loc-nyc',
              balance: 12,
              unit: 'days',
              asOf: now,
              version: 2,
            },
          }),
        ),
        http.post('/api/hcm/requests/:id/deny', ({ params }) =>
          HttpResponse.json({ requestId: params.id, status: 'denied' }),
        ),
      ],
    },
  },
}
