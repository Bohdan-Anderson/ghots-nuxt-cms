import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolveSiteId } from './fetchPage.ts'
import { validateTemplateKey } from './slug.ts'
import type { DeleteResult } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Resolves a template row by site key and template key.
 */
export async function resolveTemplate(
  supabase: SupabaseClient,
  siteKey: string,
  templateKey: string,
): Promise<{ id: string; key: string } | Response> {
  const keyError = validateTemplateKey(templateKey)
  if (keyError) {
    return errorResponse(keyError, 400)
  }

  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const key = templateKey.trim().toLowerCase()

  const { data, error } = await supabase
    .from('templates')
    .select('id, key')
    .eq('site_id', siteId)
    .eq('key', key)
    .maybeSingle()

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  if (!data) {
    return errorResponse(`Template not found: ${key}`, 404)
  }

  return data
}

/**
 * Deletes a template by site key and template key.
 */
export async function deleteTemplate(
  supabase: SupabaseClient,
  siteKey: string,
  templateKey: string,
): Promise<Response> {
  const template = await resolveTemplate(supabase, siteKey, templateKey)
  if (template instanceof Response) return template

  const { error } = await supabase.from('templates').delete().eq('id', template.id)

  if (error) {
    const mapped = mapDbError(error, { foreignKey: 'template' })
    return errorResponse(mapped.message, mapped.status)
  }

  const result: DeleteResult = {
    deleted: true,
    id: template.id,
    key: template.key,
  }

  return jsonResponse(result)
}
