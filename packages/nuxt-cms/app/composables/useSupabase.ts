import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client configured from runtime config.
 */
export function useSupabase() {
  if (!client) {
    const config = useRuntimeConfig()
    client = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey,
    )
  }
  return client
}
