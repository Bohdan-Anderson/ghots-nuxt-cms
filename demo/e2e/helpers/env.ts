import './loadEnv'

export interface E2eEnv {
  supabaseUrl: string
  supabaseAnonKey: string
  /** Optional — when set, db-reset auto-links the editor to the site via service role. */
  supabaseServiceRoleKey: string | null
  editorEmail: string
  editorPassword: string
  cmsSiteKey: string
}

const REQUIRED_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EDITOR_EMAIL',
  'E2E_EDITOR_PASSWORD',
] as const

/**
 * Loads and validates E2E environment variables from `.env`.
 */
export function getE2eEnv(): E2eEnv {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]?.trim())

  if (missing.length > 0) {
    throw new Error(
      `Missing E2E environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill in values.`,
    )
  }

  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL!.trim(),
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY!.trim(),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null,
    editorEmail: process.env.E2E_EDITOR_EMAIL!.trim(),
    editorPassword: process.env.E2E_EDITOR_PASSWORD!.trim(),
    cmsSiteKey: process.env.CMS_SITE_KEY?.trim() || 'demo',
  }
}

/**
 * Returns true when an auth/network error may succeed on retry.
 */
export function isTransientNetworkError(message: string): boolean {
  return (
    message.includes('fetch failed') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('EAI_AGAIN')
  )
}

/**
 * Verifies Supabase is reachable before E2E DB reset (fail fast with a clear message).
 */
export async function assertSupabaseReachable(supabaseUrl: string): Promise<void> {
  const healthUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`

  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok && response.status >= 500) {
      throw new Error(`Supabase returned HTTP ${response.status}`)
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const host = new URL(supabaseUrl).host
    throw new Error(
      `Cannot reach Supabase at ${host} (${detail}). ` +
        'Check your network/VPN, confirm the project is active in the Supabase dashboard, ' +
        'and verify VITE_SUPABASE_URL in .env.',
    )
  }
}
