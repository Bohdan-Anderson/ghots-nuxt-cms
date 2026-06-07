import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getE2eEnv } from './env'

/**
 * Creates a Supabase client with the service role key (E2E bootstrap only).
 */
export function createE2eServiceSupabase(): SupabaseClient {
  const env = getE2eEnv()
  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — add it to demo/.env or provision site_members manually.',
    )
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
}

/**
 * Creates a Supabase client for E2E helpers (outside Nuxt).
 */
export function createE2eSupabase(): SupabaseClient {
  const env = getE2eEnv()
  return createClient(env.supabaseUrl, env.supabaseAnonKey)
}
