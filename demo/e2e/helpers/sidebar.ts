import { expect, type Page } from '@playwright/test'

/**
 * Waits until the DOM content tree has synced field ids for the page.
 * @param index - When multiple elements share the same data-name, which one to wait for.
 */
export async function waitForPageFieldSync(
  page: Page,
  fieldName: string,
  index = 0,
): Promise<void> {
  await expect(
    page.locator(`[data-name="${fieldName}"]`).nth(index),
  ).toHaveAttribute('data-id', /^[0-9a-f-]{36}$/i, { timeout: 15_000 })
}

/**
 * Waits until every element with the given data-name has a synced field id.
 */
export async function waitForAllPageFieldSync(
  page: Page,
  fieldName: string,
): Promise<void> {
  const locator = page.locator(`[data-name="${fieldName}"]`)
  await expect
    .poll(
      async () => {
        const count = await locator.count()
        if (count === 0) return false
        for (let i = 0; i < count; i++) {
          const id = await locator.nth(i).getAttribute('data-id')
          if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return false
        }
        return true
      },
      { timeout: 15_000 },
    )
    .toBe(true)
}

/**
 * Opens the CMS panel and waits for a sidebar field button to appear.
 */
export async function openSidebarField(
  page: Page,
  fieldPattern: RegExp,
): Promise<void> {
  await page.getByRole('button', { name: 'CMS' }).click()
  await expect(page.locator('.cms-sidebar--open')).toBeVisible()
  await page.getByRole('button', { name: 'Content' }).click()
  await expect(page.getByText('Page content')).toBeVisible({ timeout: 15_000 })
  await expect(
    page.locator('.cms-sidebar-field-btn').filter({ hasText: fieldPattern }),
  ).toBeVisible({ timeout: 15_000 })
}
