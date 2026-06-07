import { test, expect } from '@playwright/test'
import { getE2eEnv } from './helpers/env'
import { loginAsNoSiteUser, tryEditPlainTextField } from './helpers/auth'
import { DEMO_BASELINE } from './helpers/db-reset'

test.describe('user without site membership', () => {
  test.beforeEach(({ }, testInfo) => {
    if (!getE2eEnv().noSiteEmail) {
      testInfo.skip(true, 'Set E2E_NO_SITE_EMAIL in demo/.env')
    }
  })

  test('authenticated non-member sees CMS UI but cannot persist edits on /demo', async ({
    page,
  }) => {
    await loginAsNoSiteUser(page)
    await page.goto('/demo')

    await expect(page.getByRole('button', { name: 'CMS' })).toBeVisible()
    await expect(page.locator('h1')).toHaveText(DEMO_BASELINE.pageTitle)

    const saved = await tryEditPlainTextField(
      page,
      'title',
      `No-site save attempt ${Date.now()}`,
    )

    expect(saved).toBe(false)
    await expect(page.locator('dialog.field-edit-modal')).toBeVisible()
    await expect(page.locator('.field-edit-modal__error')).toBeVisible()
    await expect(page.locator('h1')).toHaveText(DEMO_BASELINE.pageTitle)

    await page.reload()
    await expect(page.locator('h1')).toHaveText(DEMO_BASELINE.pageTitle)
  })
})
