import { test, expect } from '@playwright/test'
import { loginAsEditor } from './helpers/auth'
import { PUBLISH_STATIC_COMMAND } from '../../packages/nuxt-cms/app/composables/usePublish'

test('publish panel shows manual command and copy works', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await loginAsEditor(page, 'http://localhost:3001')

  await page.getByRole('button', { name: 'CMS' }).click()
  await expect(page.getByRole('region', { name: 'Publish' })).toBeVisible()
  await expect(page.getByText(PUBLISH_STATIC_COMMAND)).toBeVisible()
  await expect(
    page.getByText('Guests see the last published build'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()

  const clipboardText = await page.evaluate(async () => {
    return navigator.clipboard.readText()
  })
  expect(clipboardText).toBe(PUBLISH_STATIC_COMMAND)
})
