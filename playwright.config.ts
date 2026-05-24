import { config as loadDotenv } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

loadDotenv()

const isCi = !!process.env.CI

const supabaseEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
  E2E_EDITOR_EMAIL: process.env.E2E_EDITOR_EMAIL ?? '',
  E2E_EDITOR_PASSWORD: process.env.E2E_EDITOR_PASSWORD ?? '',
  NUXT_IGNORE_LOCK: '1',
}

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'static-guest',
      testMatch: 'guest-static.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8000',
      },
    },
    {
      name: 'editor',
      testMatch: 'editor-edit.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'publish-split',
      testMatch: 'publish-split.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: [
    {
      command: 'python3 -m http.server 8000 --directory dist',
      url: 'http://localhost:8000',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 3001',
      url: 'http://localhost:3001',
      reuseExistingServer: false,
      timeout: 120_000,
      env: supabaseEnv,
    },
  ],
})
