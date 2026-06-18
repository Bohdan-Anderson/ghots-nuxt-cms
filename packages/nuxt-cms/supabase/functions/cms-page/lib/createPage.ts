import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { resolveSiteId } from './fetchPage.ts'
import { slugify } from './slug.ts'
import type { CreatePageInput, PageRow } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

/**
 * Resolves a template UUID from its key within a site.
 */
export async function resolveTemplateId(
  supabase: SupabaseClient,
  siteId: string,
  templateKey: string,
): Promise<string | Response> {
  const { data, error } = await supabase
    .from('templates')
    .select('id')
    .eq('site_id', siteId)
    .eq('key', templateKey.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  if (!data) {
    return errorResponse(`Template not found: ${templateKey}`, 404)
  }

  return data.id
}

/**
 * Creates a page row for a site.
 */
export async function createPage(
  supabase: SupabaseClient,
  siteKey: string,
  input: CreatePageInput,
): Promise<Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const slug = slugify(input.slug)
  if (!slug) {
    return errorResponse('Enter a valid slug (letters, numbers, and hyphens).', 400)
  }

  if (!input.templateKey?.trim()) {
    return errorResponse('template_key is required', 400)
  }

  const templateId = await resolveTemplateId(supabase, siteId, input.templateKey)
  if (templateId instanceof Response) return templateId

  const { data: existing, error: existingError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .maybeSingle()

  if (existingError) {
    const mapped = mapDbError(existingError)
    return errorResponse(mapped.message, mapped.status)
  }

  if (existing) {
    return errorResponse(`A page with slug "${slug}" already exists.`, 409)
  }

  const title = input.title?.trim() || null

  const { data: inserted, error } = await supabase
    .from('pages')
    .insert({
      site_id: siteId,
      slug,
      template_id: templateId,
      title,
    })
    .select('*')
    .single()

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  return jsonResponse(inserted as PageRow, 201)
}
