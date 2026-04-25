import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { within, userEvent, expect } from 'storybook/test'
import { RequestForm } from './RequestForm'

const now = new Date().toISOString()

const aliceNyc = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  balance: 15,
  unit: 'days',
  asOf: now,
  version: 1,
}

const balanceHandler = http.get('/api/hcm/balance', ({ request }) => {
  const url = new URL(request.url)
  const locationId = url.searchParams.get('locationId')
  return HttpResponse.json(
    locationId === 'loc-nyc'
      ? aliceNyc
      : { ...aliceNyc, locationId: 'loc-lon', balance: 5 },
  )
})

const meta: Meta<typeof RequestForm> = {
  component: RequestForm,
  tags: ['autodocs'],
  argTypes: {
    employeeId: { control: 'text', description: 'The submitting employee' },
  },
  parameters: {
    msw: {
      handlers: [
        balanceHandler,
        http.post('/api/hcm/balance', () =>
          HttpResponse.json({ success: true, balance: { ...aliceNyc, balance: 14, version: 2 } }),
        ),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof RequestForm>

export const Idle: Story = {
  args: { employeeId: 'emp-alice' },
}

// Interaction test: fill form → submit → verify optimistic-pending state
export const Submitting: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        balanceHandler,
        http.post('/api/hcm/balance', async () => {
          await delay('infinite')
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc')
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01')
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03')
    await userEvent.click(canvas.getByRole('button', { name: /request time off/i }))
    await expect(canvas.getByRole('button', { name: /submitting/i })).toBeInTheDocument()
  },
}

// Interaction test: submit → HCM 4xx → banner shows rolled-back state
export const OptimisticRolledBack: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        balanceHandler,
        http.post('/api/hcm/balance', () =>
          HttpResponse.json(
            { code: 'REJECTED', message: 'Insufficient balance' },
            { status: 422 },
          ),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc')
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01')
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03')
    await userEvent.click(canvas.getByRole('button', { name: /request time off/i }))
    await expect(await canvas.findByText('Request rejected')).toBeInTheDocument()
  },
}

// Interaction test: submit → HCM 200 with silent failure → banner shows hcm-silently-wrong
export const HcmSilentlyWrong: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        balanceHandler,
        // 200 but version unchanged — silent failure path
        http.post('/api/hcm/balance', () =>
          HttpResponse.json({ success: true, balance: aliceNyc }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByRole('combobox'), 'loc-nyc')
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01')
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03')
    await userEvent.click(canvas.getByRole('button', { name: /request time off/i }))
    await expect(await canvas.findByText('Unconfirmed')).toBeInTheDocument()
  },
}

// Disabled state: mutation in-flight locks the form
export const Disabled: Story = {
  args: { employeeId: 'emp-alice' },
  parameters: {
    msw: {
      handlers: [
        balanceHandler,
        http.post('/api/hcm/balance', async () => {
          await delay('infinite')
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Start date'), '2026-05-01')
    await userEvent.type(canvas.getByLabelText('End date'), '2026-05-03')
    await userEvent.click(canvas.getByRole('button', { name: /request time off/i }))
    await expect(canvas.getByRole('combobox')).toBeDisabled()
    await expect(canvas.getByLabelText('Start date')).toBeDisabled()
    await expect(canvas.getByLabelText('End date')).toBeDisabled()
  },
}
