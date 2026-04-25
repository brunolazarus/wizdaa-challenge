import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { userEvent, within, expect } from 'storybook/test'
import { RequestCard } from './RequestCard'
import type { HcmPendingRequest } from '@/lib/hcm-types'

const now = new Date().toISOString()
const staleAsOf = new Date(Date.now() - 90_000).toISOString()

const request: HcmPendingRequest = {
  id: 'req-001',
  employeeId: 'emp-alice',
  employeeName: 'Alice Johnson',
  locationId: 'loc-nyc',
  delta: -3,
  reason: 'Family vacation',
  submittedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  status: 'pending',
}

const freshBalance = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  balance: 15,
  unit: 'days',
  asOf: now,
  version: 1,
}

const freshBalanceHandler = http.get('/api/hcm/balance', () =>
  HttpResponse.json(freshBalance),
)

const meta: Meta<typeof RequestCard> = {
  component: RequestCard,
  tags: ['autodocs'],
  argTypes: {
    request: { control: 'object', description: 'Pending time-off request from the HCM request store' },
  },
}

export default meta
type Story = StoryObj<typeof RequestCard>

export const PendingWithFreshBalance: Story = {
  args: { request },
  parameters: {
    msw: {
      handlers: [
        freshBalanceHandler,
        http.post('/api/hcm/requests/:id/approve', () =>
          HttpResponse.json({
            requestId: 'req-001',
            status: 'approved',
            balance: { ...freshBalance, balance: 12, version: 2 },
          }),
        ),
        http.post('/api/hcm/requests/:id/deny', () =>
          HttpResponse.json({ requestId: 'req-001', status: 'denied' }),
        ),
      ],
    },
  },
}

export const PendingWithStaleBalance: Story = {
  args: { request },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance', () =>
          HttpResponse.json({ ...freshBalance, asOf: staleAsOf }),
        ),
      ],
    },
  },
}

export const ApprovingInFlight: Story = {
  args: { request },
  parameters: {
    msw: {
      handlers: [
        freshBalanceHandler,
        http.post('/api/hcm/requests/:id/approve', async () => {
          await delay('infinite')
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('15 days')
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    await expect(canvas.getByRole('button', { name: 'Approving…' })).toBeInTheDocument()
  },
}

export const ApproveConfirmed: Story = {
  args: { request },
  parameters: {
    msw: {
      handlers: [
        freshBalanceHandler,
        http.post('/api/hcm/requests/:id/approve', () =>
          HttpResponse.json({
            requestId: 'req-001',
            status: 'approved',
            balance: { ...freshBalance, balance: 12, version: 2 },
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('15 days')
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    await canvas.findByText('Approved')
  },
}

export const DenyConfirmed: Story = {
  args: { request },
  parameters: {
    msw: {
      handlers: [
        freshBalanceHandler,
        http.post('/api/hcm/requests/:id/deny', () =>
          HttpResponse.json({ requestId: 'req-001', status: 'denied' }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('15 days')
    await userEvent.click(canvas.getByRole('button', { name: 'Deny' }))
    await canvas.findByText('Denied')
  },
}
