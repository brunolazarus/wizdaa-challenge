import type { Preview } from '@storybook/react'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import '../app/globals.css'

initialize()

const preview: Preview = {
  parameters: {
    docs: { autodocs: 'tag' },
  },
  loaders: [mswLoader],
  decorators: [
    (Story) => {
      const [queryClient] = React.useState(
        () =>
          new QueryClient({
            defaultOptions: { queries: { retry: false, staleTime: 0 } },
          }),
      )
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
}

export default preview
