import { test, expect } from '@playwright/test'
import { loginAsEditor } from './helpers/auth'
import { DEMO_BASELINE } from './helpers/db-reset'

test('editor can edit slice field on demo page via modal', async ({ page }) => {
  const editedHeadline = `Slice E2E ${Date.now()}`

  await loginAsEditor(page, 'http://localhost:3001')
  await page.goto('/demo')
  await expect(page.locator('.hero-slice h2').first()).toHaveText(
    DEMO_BASELINE.firstHeroHeadline,
  )

  await page.locator('.hero-slice h2').first().click()
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(editedHeadline)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  await expect(page.locator('.hero-slice h2').first()).toHaveText(editedHeadline)
  await page.reload()
  await expect(page.locator('.hero-slice h2').first()).toHaveText(editedHeadline)
})
