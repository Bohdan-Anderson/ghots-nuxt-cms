const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
}

/**
 * Returns a JSON response with CORS headers.
 */
export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * Returns a JSON error response.
 */
export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status)
}

/**
 * Handles CORS preflight requests.
 */
export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * Maps Supabase/Postgres errors to HTTP status codes.
 */
export function mapDbError(
  error: { message?: string; code?: string },
  context?: { foreignKey?: string },
): {
  status: number
  message: string
} {
  const message = error.message ?? 'Database error'

  if (
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    error.code === '42501'
  ) {
    return { status: 403, message: 'Forbidden' }
  }

  if (error.code === '23505') {
    return { status: 409, message: 'Already exists' }
  }

  if (error.code === '23503') {
    if (context?.foreignKey === 'template') {
      return { status: 409, message: 'Template is in use by one or more pages' }
    }
    return { status: 409, message: 'Referenced record is in use' }
  }

  return { status: 500, message }
}
