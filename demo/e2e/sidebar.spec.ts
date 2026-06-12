import { test, expect } from '@playwright/test'
import { loginAsEditor } from './helpers/auth'
import { waitForAllPageFieldSync, waitForPageFieldSync } from './helpers/sidebar'

test('sidebar: edit via content tree, save meta', async ({ page }) => {
  const uniqueSlug = `/e2e-sidebar-${Date.now()}`
  const pageTitle = 'Sidebar E2E Page'
  const editedHeadline = `Tree edit ${Date.now()}`
  const metaDescription = `Meta from sidebar ${Date.now()}`

  await loginAsEditor(page, 'http://localhost:3001')

  await page.getByRole('button', { name: 'CMS' }).click()
  await page.getByRole('button', { name: 'Pages' }).click()

  await page.getByPlaceholder('/about').fill(uniqueSlug)
  await page.getByPlaceholder('About us').fill(pageTitle)
  await page
    .locator('.cms-sidebar-form select')
    .selectOption({ label: 'Sections demo' })
  await page.getByRole('button', { name: 'Create page' }).click()

  await expect(page).toHaveURL(new RegExp(`${uniqueSlug.replace(/\//g, '\\/')}$`))

  await waitForPageFieldSync(page, 'title')
  await page.getByRole('button', { name: 'Content' }).click()
  await expect(
    page.getByRole('button', { name: /^title:/i }),
  ).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /^title:/i }).click()
  const titleDialog = page.locator('dialog.field-edit-modal')
  await expect(titleDialog).toBeVisible()
  await titleDialog.locator('textarea').fill(pageTitle)
  await titleDialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('h1')).toHaveText(pageTitle)

  await expect(page.locator('.hero-section')).toHaveCount(2)

  await waitForAllPageFieldSync(page, 'headline')
  await page.getByRole('button', { name: 'Content' }).click()
  await expect(
    page.getByRole('button', { name: /^headline:/i }).first(),
  ).toBeVisible({ timeout: 15_000 })

  await page
    .getByRole('button', { name: /^headline:/i })
    .first()
    .click()

  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(editedHeadline)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  await expect(page.locator('.hero-section h2').first()).toHaveText(editedHeadline)

  await page.getByRole('button', { name: 'Meta' }).click()
  await page.getByRole('textbox', { name: 'Meta description' }).fill(metaDescription)
  await page.getByRole('button', { name: 'Save meta' }).click()

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    metaDescription,
  )
})
