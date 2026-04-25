import type { Meta, StoryObj } from '@storybook/react'
import { BalanceFreshnessIndicator } from './BalanceFreshnessIndicator'

const now = new Date().toISOString()
const staleAsOf = new Date(Date.now() - 90_000).toISOString()

const meta: Meta<typeof BalanceFreshnessIndicator> = {
  component: BalanceFreshnessIndicator,
  tags: ['autodocs'],
  argTypes: {
    asOf: {
      control: 'text',
      description: 'ISO 8601 timestamp of last known-good balance read from HCM',
    },
    isStale: {
      control: 'boolean',
      description: 'True when asOf exceeds the 60s manager staleness threshold',
    },
    isFetching: {
      control: 'boolean',
      description: 'True while a re-fetch is in-flight',
    },
  },
}

export default meta
type Story = StoryObj<typeof BalanceFreshnessIndicator>

export const Fresh: Story = {
  args: { asOf: now, isStale: false, isFetching: false },
}

export const Stale: Story = {
  args: { asOf: staleAsOf, isStale: true, isFetching: false },
}

export const Refreshing: Story = {
  args: { asOf: staleAsOf, isStale: true, isFetching: true },
}
