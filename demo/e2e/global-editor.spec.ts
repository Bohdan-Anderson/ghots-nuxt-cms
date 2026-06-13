import { test, expect } from '@playwright/test'
import { loginAsEditor } from './helpers/auth'
import { DEMO_BASELINE } from './helpers/db-reset'

test('editor can edit global nav_label via on-page click', async ({ page }) => {
  const editedLabel = `Global nav ${Date.now()}`

  await loginAsEditor(page, 'http://localhost:3001')

  const navLabel = page.locator('[data-global="site"] [data-name="nav_label"]')
  await expect(navLabel).toHaveText(DEMO_BASELINE.navLabel)
  await expect(navLabel).toHaveAttribute('data-id', /^[0-9a-f-]{36}$/i, {
    timeout: 15_000,
  })

  await navLabel.dispatchEvent('click')
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(editedLabel)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(navLabel).toHaveText(editedLabel)

  await page.reload()
  await expect(navLabel).toHaveText(editedLabel)
})
