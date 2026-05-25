import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

loadDotenv({ path: resolve(process.cwd(), '.env') })

const isCi = !!process.env.CI
const recordVideo = !!process.env.E2E_VIDEO
const videoSlowMo = Number(process.env.E2E_VIDEO_SLOW_MO ?? 400)

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
  timeout: recordVideo ? 120_000 : 60_000,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: recordVideo
    ? [['html', { open: 'never' }], ['list']]
    : 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    trace: 'on-first-retry',
    video: recordVideo ? 'on' : 'off',
    ...(recordVideo ? { launchOptions: { slowMo: videoSlowMo } } : {}),
  },
  projects: [
    {
      name: 'static-guest',
      testMatch: ['guest-static.spec.ts', 'content-model-v2.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8000',
      },
    },
    {
      name: 'editor',
      testMatch: ['editor-edit.spec.ts', 'content-model-v2-editor.spec.ts'],
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
