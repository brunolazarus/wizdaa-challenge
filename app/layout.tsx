import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { Providers } from './providers'
import { queryKeys } from '@/lib/query-keys'
import { getStore } from '@/mocks/store'
import { getBalances } from '@/mocks/hcm-logic'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ExampleHR — Time Off',
  description: 'Time-off request management',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side: populate QueryClient with the full balance corpus so the first
  // paint requires no client-side fetch. HydrationBoundary transfers this into
  // the client cache. Per-cell keys are pre-populated from the batch result.
  const queryClient = new QueryClient()
  const batch = getBalances(getStore())
  queryClient.setQueryData(queryKeys.balances(), batch)
  batch.rows.forEach((row) => {
    queryClient.setQueryData(queryKeys.balance(row.employeeId, row.locationId), row)
  })

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  )
}
