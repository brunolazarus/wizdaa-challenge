import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { RequestStatusBanner } from './RequestStatusBanner'

const meta: Meta<typeof RequestStatusBanner> = {
  component: RequestStatusBanner,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'idle',
        'optimistic-pending',
        'hcm-confirmed',
        'hcm-rejected',
        'hcm-conflict',
        'hcm-silently-wrong',
        'optimistic-rolled-back',
      ],
      description: 'Current state of the time-off request',
    },
    onReset: { description: 'Called when the user dismisses the banner' },
  },
  args: { onReset: fn() },
}

export default meta
type Story = StoryObj<typeof RequestStatusBanner>

export const OptimisticPending: Story = {
  args: { status: 'optimistic-pending' },
}

export const HcmConfirmed: Story = {
  args: { status: 'hcm-confirmed' },
}

export const HcmRejected: Story = {
  args: { status: 'hcm-rejected' },
}

export const HcmConflict: Story = {
  args: { status: 'hcm-conflict' },
}

export const HcmSilentlyWrong: Story = {
  args: { status: 'hcm-silently-wrong' },
}

export const OptimisticRolledBack: Story = {
  args: { status: 'optimistic-rolled-back' },
}
