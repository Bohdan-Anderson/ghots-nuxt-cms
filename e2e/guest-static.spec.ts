import { test, expect } from '@playwright/test'
import { BASELINE } from './helpers/db-reset'

test('guest on static deploy loads home without fetching fields from Supabase', async ({
  page,
}) => {
  const fieldRequests: string[] = []

  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/rest/v1/fields')) {
      fieldRequests.push(url)
    }
  })

  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('h1')).toHaveText(BASELINE.title)

  expect(
    fieldRequests,
    'Guest static page body should not fetch fields from Supabase',
  ).toHaveLength(0)
})
