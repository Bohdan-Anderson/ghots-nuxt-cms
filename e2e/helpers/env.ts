import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'

loadDotenv({ path: resolve(process.cwd(), '.env') })

export interface E2eEnv {
  supabaseUrl: string
  supabaseAnonKey: string
  editorEmail: string
  editorPassword: string
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
    editorEmail: process.env.E2E_EDITOR_EMAIL!.trim(),
    editorPassword: process.env.E2E_EDITOR_PASSWORD!.trim(),
  }
}
