import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { signInClient } from './auth.ts'
import { errorResponse } from './response.ts'
import type { AuthBody } from './types.ts'

/**
 * Parses JSON from the request body.
 */
export async function parseJsonBody<T>(req: Request): Promise<T | Response> {
  try {
    return await req.json() as T
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }
}

/**
 * Parses email and password from a write request body.
 */
export function parseAuthBody(body: AuthBody): AuthBody | Response {
  const { email, password } = body

  if (!email || !password) {
    return errorResponse('email and password are required', 400)
  }

  return { email, password }
}

/**
 * Signs in and returns an authenticated Supabase client.
 */
export async function requireAuth(body: AuthBody): Promise<SupabaseClient | Response> {
  const authOrError = parseAuthBody(body)
  if (authOrError instanceof Response) return authOrError

  return signInClient(authOrError.email, authOrError.password)
}
