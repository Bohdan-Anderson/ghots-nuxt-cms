import { test, expect } from '@playwright/test'
import { editPlainTextField, loginAsEditor } from './helpers/auth'
import { getHomePageRootField } from './helpers/db-reset'

test('editor on-demand sync creates missing field from markup and it is editable', async ({
  page,
}) => {
  const editedSubtitle = `E2E on-demand subtitle ${Date.now()}`

  const beforeSync = await getHomePageRootField('subtitle')
  expect(beforeSync).toBeNull()

  await loginAsEditor(page)

  const subtitle = page.locator('[data-name="subtitle"]')
  await expect(subtitle).toBeAttached()

  await expect(subtitle).toHaveAttribute(
    'data-id',
    /^[0-9a-f-]{36}$/i,
    { timeout: 15_000 },
  )

  const fieldId = await subtitle.getAttribute('data-id')
  expect(fieldId).toBeTruthy()

  const afterSync = await getHomePageRootField('subtitle')
  expect(afterSync).not.toBeNull()
  expect(afterSync?.id).toBe(fieldId)
  expect(afterSync?.type).toBe('plain_text')

  await editPlainTextField(page, 'subtitle', editedSubtitle)
  await expect(subtitle).toHaveText(editedSubtitle)

  await page.reload()
  await expect(subtitle).toHaveText(editedSubtitle)

  const afterEdit = await getHomePageRootField('subtitle')
  expect(afterEdit?.value).toBe(editedSubtitle)
})
