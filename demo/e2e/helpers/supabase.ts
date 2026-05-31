import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getE2eEnv } from './env'

/**
 * Creates a Supabase client for E2E helpers (outside Nuxt).
 */
export function createE2eSupabase(): SupabaseClient {
  const env = getE2eEnv()
  return createClient(env.supabaseUrl, env.supabaseAnonKey)
}
