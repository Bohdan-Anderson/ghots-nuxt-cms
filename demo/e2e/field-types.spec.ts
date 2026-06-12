import { test, expect } from '@playwright/test'
import { loginAsEditor } from './helpers/auth'
import { DEMO_BASELINE } from './helpers/db-reset'

test('editor can edit link and richtext on demo CTA section', async ({ page }) => {
  const editedLabel = `E2E CTA ${Date.now()}`
  const editedSource = `Updated **richtext** ${Date.now()}`

  await loginAsEditor(page, 'http://localhost:3001')
  await page.goto('/demo')

  await expect(page.locator('.cta-section a')).toHaveText(DEMO_BASELINE.ctaLinkLabel)

  await page.locator('.cta-section a').click()
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Label').fill(editedLabel)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.cta-section a')).toHaveText(editedLabel)

  await page.locator('.cta-section .cms-richtext').click()
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(editedSource)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  const richtext = page.locator('.cta-section .cms-richtext')
  await expect(richtext).toContainText('Updated')
  await expect(richtext.locator('strong')).toHaveText('richtext')

  await page.reload()
  await expect(page.locator('.cta-section a')).toHaveText(editedLabel)
  const richtextAfterReload = page.locator('.cta-section .cms-richtext')
  await expect(richtextAfterReload).toContainText('Updated')
  await expect(richtextAfterReload.locator('strong')).toHaveText('richtext')
})
