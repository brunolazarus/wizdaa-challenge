import type { Meta, StoryObj } from '@storybook/react'
import { StaleDataWarning } from './StaleDataWarning'

const meta: Meta<typeof StaleDataWarning> = {
  component: StaleDataWarning,
  tags: ['autodocs'],
  argTypes: {
    preBalance: { control: 'number', description: 'Balance before the request was submitted' },
    postBalance: {
      control: 'number',
      description: "Balance HCM reports after the '200 success' response",
    },
    unit: { control: 'text', description: "Balance unit, e.g. 'days' or 'hours'" },
  },
}

export default meta
type Story = StoryObj<typeof StaleDataWarning>

export const Default: Story = {
  args: {
    preBalance: 15,
    postBalance: 15,
    unit: 'days',
  },
}

export const HoursUnit: Story = {
  args: {
    preBalance: 40,
    postBalance: 40,
    unit: 'hours',
  },
}
