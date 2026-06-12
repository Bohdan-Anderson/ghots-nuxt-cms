import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loginAsEditor } from './helpers/auth'
import { DEMO_BASELINE } from './helpers/db-reset'
import { waitForPageFieldSync } from './helpers/sidebar'
import { projectRoot } from './helpers/loadEnv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testImagePath = path.join(__dirname, 'fixtures/test-image.png')
const STATIC_URL = 'http://localhost:8000'

test.describe.configure({ mode: 'serial' })

test('editor can upload image and add/remove team array items', async ({
  page,
}) => {
  const newMemberName = `E2E Member ${Date.now()}`

  await loginAsEditor(page, 'http://localhost:3001')
  await page.goto('/demo')

  const teamSlice = page.locator('.team-section')
  await expect(teamSlice).toBeVisible()
  await expect(teamSlice.locator('.team-section__member')).toHaveCount(1)
  await expect(teamSlice.locator('.team-section__name')).toHaveText('Alex Example')

  await waitForPageFieldSync(page, 'members')

  await page.getByRole('button', { name: 'CMS' }).click()
  const sidebar = page.locator('.cms-sidebar--open')
  await expect(page.getByText('Page content')).toBeVisible({ timeout: 15_000 })

  await expect(sidebar.getByRole('button', { name: 'Add item' })).toBeVisible({
    timeout: 15_000,
  })
  await sidebar.getByRole('button', { name: 'Add item' }).click()
  await expect(teamSlice.locator('.team-section__member')).toHaveCount(2)

  const secondMember = teamSlice.locator('.team-section__member').nth(1)
  await expect(secondMember.locator('.cms-image-empty')).toBeVisible()
  await waitForPageFieldSync(page, 'name', 1)

  await secondMember.locator('[data-name="name"]').click()
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('textarea').fill(newMemberName)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(secondMember.locator('.team-section__name')).toHaveText(
    newMemberName,
  )

  const photoFieldRow = sidebar
    .locator('.cms-sidebar-field-btn')
    .filter({ hasText: 'photo:' })
    .last()
  await photoFieldRow.click()
  await expect(dialog).toBeVisible()
  await dialog.locator('input[type="file"]').setInputFiles(testImagePath)
  await expect(dialog.locator('.field-edit-image__preview img')).toBeVisible({
    timeout: 15_000,
  })
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  const uploadedImage = secondMember.locator('.cms-image')
  await expect(uploadedImage).toBeVisible()
  await expect(uploadedImage).toHaveAttribute('src', /^https?:\/\//)

  await page.reload()
  await expect(teamSlice.locator('.team-section__member')).toHaveCount(2)
  await expect(
    teamSlice.locator('.team-section__member').nth(1).locator('.team-section__name'),
  ).toHaveText(newMemberName)
  await expect(
    teamSlice.locator('.team-section__member').nth(1).locator('.cms-image'),
  ).toHaveAttribute('src', /^https?:\/\//)

  await page.getByRole('button', { name: 'CMS' }).click()
  page.once('dialog', (alert) => alert.accept())
  await sidebar
    .locator('.cms-sidebar-array-item')
    .filter({ hasText: 'Item 2' })
    .getByRole('button', { title: 'Remove item' })
    .click()
  await expect(teamSlice.locator('.team-section__member')).toHaveCount(1)
  await expect(teamSlice.locator('.team-section__name')).toHaveText('Alex Example')
})

test('generate localizes cms-media images for static guests', async ({
  page,
  browser,
}) => {
  await loginAsEditor(page, 'http://localhost:3001')
  await page.goto('/demo')

  await waitForPageFieldSync(page, 'photo')
  await page.getByRole('button', { name: 'CMS' }).click()
  const sidebar = page.locator('.cms-sidebar--open')
  await expect(page.getByText('Page content')).toBeVisible({ timeout: 15_000 })
  const photoFieldRow = sidebar
    .locator('.cms-sidebar-field-btn')
    .filter({ hasText: 'photo:' })
    .first()

  await expect(photoFieldRow).toBeVisible({ timeout: 15_000 })
  await photoFieldRow.click()
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()
  await dialog.locator('input[type="file"]').setInputFiles(testImagePath)
  await expect(dialog.locator('.field-edit-image__preview img')).toBeVisible({
    timeout: 15_000,
  })
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()

  execSync('npm run generate', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  })

  const guestContext = await browser.newContext()
  const guestPage = await guestContext.newPage()
  await guestPage.goto(`${STATIC_URL}/demo`)
  await expect(guestPage.locator('.team-section .cms-image')).toHaveAttribute(
    'src',
    /^\/cms-media\//,
  )
  await expect(guestPage.locator('.team-section__name')).toHaveText(
    DEMO_BASELINE.teamMemberName,
  )

  const payload = readFileSync(
    join(projectRoot, 'dist/demo/_payload.json'),
    'utf8',
  )
  expect(payload).toContain('/cms-media/')
  expect(payload).not.toMatch(/supabase\.co.*cms-media/)

  await guestContext.close()
})
