import { expect, type Page } from '@playwright/test'
import { getE2eEnv } from './env'
import { createE2eSupabase } from './supabase'

/**
 * Derives the Supabase auth localStorage key from the project URL.
 */
function getSupabaseStorageKey(supabaseUrl: string): string {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

/**
 * Signs in via Supabase API and injects the session into the browser.
 * @param baseURL - Optional origin (e.g. http://localhost:3001) when project has no baseURL.
 */
export async function loginAsEditor(
  page: Page,
  baseURL?: string,
): Promise<void> {
  const env = getE2eEnv()
  const root = baseURL?.replace(/\/$/, '') ?? ''
  const supabase = createE2eSupabase()

  const { error } = await supabase.auth.signInWithPassword({
    email: env.editorEmail,
    password: env.editorPassword,
  })
  if (error) throw new Error(`E2E sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('No session after E2E sign-in')

  const storageKey = getSupabaseStorageKey(env.supabaseUrl)

  await page.goto(`${root}/login`)
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    {
      key: storageKey,
      value: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      },
    },
  )

  await supabase.auth.signOut()

  await page.goto(`${root}/`)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'CMS' })).toBeVisible({
    timeout: 15_000,
  })
}

/**
 * Opens the plain_text edit modal for a field by data-name and saves a value.
 */
export async function editPlainTextField(
  page: Page,
  fieldName: string,
  value: string,
): Promise<void> {
  await page.locator(`[data-name="${fieldName}"]`).click()
  const dialog = page.locator('dialog.field-edit-modal')
  await expect(dialog).toBeVisible()

  await dialog.locator('textarea').fill(value)
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).not.toBeVisible()
}
