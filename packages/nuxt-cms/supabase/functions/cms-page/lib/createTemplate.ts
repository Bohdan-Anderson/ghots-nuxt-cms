import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolveSiteId } from './fetchPage.ts'
import { validateTemplateKey } from './slug.ts'
import type { CreateTemplateInput, TemplateRow } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Creates a template row for a site.
 */
export async function createTemplate(
  supabase: SupabaseClient,
  siteKey: string,
  input: CreateTemplateInput,
): Promise<Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const keyError = validateTemplateKey(input.key)
  if (keyError) {
    return errorResponse(keyError, 400)
  }

  const key = input.key.trim().toLowerCase()
  const label = input.label?.trim()

  if (!label) {
    return errorResponse('label is required', 400)
  }

  const { data: existing, error: existingError } = await supabase
    .from('templates')
    .select('id')
    .eq('site_id', siteId)
    .eq('key', key)
    .maybeSingle()

  if (existingError) {
    const mapped = mapDbError(existingError)
    return errorResponse(mapped.message, mapped.status)
  }

  if (existing) {
    return errorResponse(`A template with key "${key}" already exists.`, 409)
  }

  const { data: inserted, error } = await supabase
    .from('templates')
    .insert({
      site_id: siteId,
      key,
      label,
      field_schema: [],
    })
    .select('*')
    .single()

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  return jsonResponse(inserted as TemplateRow, 201)
}
