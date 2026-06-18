import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolveSiteId } from './fetchPage.ts'
import type { PageRow } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Fetches all page rows for a site (no fields or templates).
 */
export async function fetchPageList(
  supabase: SupabaseClient,
  siteKey: string,
): Promise<Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', siteId)
    .order('slug', { ascending: true })

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  return jsonResponse((data ?? []) as PageRow[])
}
