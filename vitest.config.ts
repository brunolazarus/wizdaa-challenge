import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    projects: [
      // Storybook stories — run in a real browser via Playwright
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      // Unit + integration tests — run in jsdom with MSW server
      {
        plugins: [react()],
        resolve: {
          alias: { '@': path.resolve(dirname, '.') },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['**/*.stories.{ts,tsx}', 'node_modules/**', '.next/**'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        'hooks/**': { branches: 80 },
        'lib/**': { branches: 80 },
        'components/**': { statements: 70 },
      },
    },
  },
})
