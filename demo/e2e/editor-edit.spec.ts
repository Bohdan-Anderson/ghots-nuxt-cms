import { test, expect } from '@playwright/test'
import { editPlainTextField, loginAsEditor } from './helpers/auth'
import { waitForPageFieldSync, openSidebarField } from './helpers/sidebar'

test('editor can edit plain_text via modal and value persists after refresh', async ({
  page,
}) => {
  const editedTitle = `E2E edited ${Date.now()}`

  await loginAsEditor(page)
  await editPlainTextField(page, 'title', editedTitle)

  await expect(page.locator('h1')).toHaveText(editedTitle)
  await page.reload()
  await expect(page.locator('h1')).toHaveText(editedTitle)
})

test('editor can edit plain_text via sidebar and page updates without navigation', async ({
  page,
}) => {
  const editedTitle = `Sidebar E2E ${Date.now()}`

  await loginAsEditor(page)
  await waitForPageFieldSync(page, 'title')
  await openSidebarField(page, /^title:/i)
  await page
    .locator('.cms-sidebar-field-btn')
    .filter({ hasText: /^title:/i })
    .click()

  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(editedTitle)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  await expect(page.locator('h1')).toHaveText(editedTitle)
})
