import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'
import { BASELINE, resetHomePageFields } from './helpers/db-reset'
import { editPlainTextField, loginAsEditor } from './helpers/auth'

const STATIC_URL = 'http://localhost:8000'
const DEV_URL = 'http://localhost:3001'
const UNPUBLISHED_TITLE = 'E2E Unpublished Title'

test.describe.configure({ mode: 'serial' })

test('guest sees stale static content until regenerate after editor save', async ({
  browser,
}) => {
  await resetHomePageFields()
  execSync('npm run generate', {
    cwd: resolve(process.cwd()),
    stdio: 'inherit',
    env: process.env,
  })

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()

  await guestPage.goto(`${STATIC_URL}/`)
  await expect(guestPage.locator('h1')).toHaveText(BASELINE.title)

  const editorContext = await browser.newContext()
  const editorPage = await editorContext.newPage()

  await loginAsEditor(editorPage, DEV_URL)
  await editPlainTextField(editorPage, 'title', UNPUBLISHED_TITLE)
  await expect(editorPage.locator('h1')).toHaveText(UNPUBLISHED_TITLE)

  await guestPage.goto(`${STATIC_URL}/`)
  await expect(guestPage.locator('h1')).toHaveText(BASELINE.title)

  execSync('npm run generate', {
    cwd: resolve(process.cwd()),
    stdio: 'inherit',
    env: process.env,
  })

  await guestPage.goto(`${STATIC_URL}/`)
  await expect(guestPage.locator('h1')).toHaveText(UNPUBLISHED_TITLE)

  await guestContext.close()
  await editorContext.close()
})
