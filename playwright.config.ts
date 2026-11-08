import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // The dev server, not a production build: Better Auth forces https outside `nuxt dev` (server/utils/auth.ts), so
    // signing up on http://localhost would fail against a build.
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    // Nuxt's output in the test log: its startup time, and Vite's warnings.
    stdout: 'pipe',
    // Playwright's default 60 s startup timeout: CI's cold `nuxt dev` answers in about 8 s.
    reuseExistingServer: !process.env.CI,
  },
})
