import type { Meta, StoryObj } from '@storybook/react'
import { BalanceCell } from './BalanceCell'

const now = new Date().toISOString()
const staleAsOf = new Date(Date.now() - 90_000).toISOString()

const baseBalance = {
  employeeId: 'emp-alice',
  locationId: 'loc-nyc',
  balance: 15,
  unit: 'days' as const,
  version: 1,
}

const meta: Meta<typeof BalanceCell> = {
  component: BalanceCell,
  tags: ['autodocs'],
  argTypes: {
    balance: { control: 'object', description: 'HcmBalance from the query cache, or undefined while loading' },
    isFetching: { control: 'boolean', description: 'True while a background poll is in-flight' },
    justUpdated: { control: 'boolean', description: 'True for ~3s after a background poll lands a new version' },
  },
}

export default meta
type Story = StoryObj<typeof BalanceCell>

export const Default: Story = {
  args: {
    balance: { ...baseBalance, asOf: now },
    isFetching: false,
    justUpdated: false,
  },
}

export const Loading: Story = {
  args: {
    balance: undefined,
    isFetching: true,
    justUpdated: false,
  },
}

export const Stale: Story = {
  args: {
    balance: { ...baseBalance, asOf: staleAsOf },
    isFetching: false,
    justUpdated: false,
  },
}

export const Refreshing: Story = {
  args: {
    balance: { ...baseBalance, asOf: now },
    isFetching: true,
    justUpdated: false,
  },
}

export const JustUpdated: Story = {
  args: {
    balance: { ...baseBalance, asOf: now },
    isFetching: false,
    justUpdated: true,
  },
}
