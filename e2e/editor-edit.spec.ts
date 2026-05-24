import { test, expect } from '@playwright/test'
import { editPlainTextField, loginAsEditor } from './helpers/auth'

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
