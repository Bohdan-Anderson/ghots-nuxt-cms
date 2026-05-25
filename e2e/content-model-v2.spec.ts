import { test, expect } from '@playwright/test'
import { getE2eEnv } from './helpers/env'
import { DEMO_BASELINE } from './helpers/db-reset'

test('guest on static deploy loads demo page with slices and global nav', async ({
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

  await page.goto('/demo')
  await expect(page.locator('nav strong')).toHaveText(DEMO_BASELINE.navLabel)
  await expect(page.locator('h1')).toHaveText(DEMO_BASELINE.pageTitle)
  await expect(page.locator('.hero-slice h2')).toHaveCount(2)
  await expect(page.locator('.hero-slice h2').first()).toHaveText(
    DEMO_BASELINE.firstHeroHeadline,
  )
  await expect(page.locator('.hero-slice h2').nth(1)).toHaveText(
    DEMO_BASELINE.secondHeroHeadline,
  )

  expect(
    supabaseRequests,
    'Guest static deploy should not call Supabase',
  ).toHaveLength(0)
})

test('guest on static deploy has page meta in document head', async ({
  page,
}) => {
  await page.goto('/demo')
  await expect(page).toHaveTitle(DEMO_BASELINE.metaTitle)
})
