import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { errorResponse } from './response.ts'

/**
 * Creates an anonymous Supabase client using project env vars.
 */
export function createAnonClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
  }

  return createClient(url, anonKey)
}

/**
 * Signs in with email/password and returns a user-scoped Supabase client.
 */
export async function signInClient(
  email: string,
  password: string,
): Promise<SupabaseClient | Response> {
  const client = createAnonClient()

  const { error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    return errorResponse('Invalid credentials', 401)
  }

  return client
}
