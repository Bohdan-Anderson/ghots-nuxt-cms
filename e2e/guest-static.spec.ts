import { test, expect } from '@playwright/test'
import { getE2eEnv } from './helpers/env'
import { BASELINE } from './helpers/db-reset'

test('guest on static deploy loads home without any Supabase requests', async ({
  page,
}) => {
  const supabaseHost = new URL(getE2eEnv().supabaseUrl).hostname
  const supabaseRequests: string[] = []

  page.on('request', (request) => {
    const url = request.url()
    if (url.includes(supabaseHost)) {
      supabaseRequests.push(url)
    }
  })

  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('h1')).toHaveText(BASELINE.title)

  expect(
    supabaseRequests,
    'Guest static deploy should not call Supabase',
  ).toHaveLength(0)
})
