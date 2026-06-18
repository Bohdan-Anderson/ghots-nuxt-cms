import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { nestFields } from './fieldTree.ts'
import { normalizeSlug } from './slug.ts'
import type { FieldRow, PageApiContent, PageRow, TemplateRow } from './types.ts'
import { errorResponse, jsonResponse, mapDbError } from './response.ts'

type PageWithTemplate = PageRow & { templates: TemplateRow }

/**
 * Resolves a site UUID from its key.
 */
export async function resolveSiteId(
  supabase: SupabaseClient,
  siteKey: string,
): Promise<string | Response> {
  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('key', siteKey)
    .maybeSingle()

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  if (!data) {
    return errorResponse(`Site not found: ${siteKey}`, 404)
  }

  return data.id
}

/**
 * Builds the edge function page payload with nested fields.
 */
export function buildPageApiPayload(
  page: PageRow,
  template: TemplateRow,
  fields: FieldRow[],
): PageApiContent {
  return {
    page: {
      id: page.id,
      slug: page.slug,
      template_id: page.template_id,
      title: page.title,
      meta_title: page.meta_title ?? null,
      meta_description: page.meta_description ?? null,
      og_image: page.og_image ?? null,
      noindex: page.noindex ?? false,
      created_at: page.created_at,
      updated_at: page.updated_at,
    },
    template: {
      id: template.id,
      key: template.key,
      label: template.label,
      field_schema: template.field_schema,
    },
    fields: nestFields(fields),
  }
}

/**
 * Fetches page + template + fields for a site key and slug.
 */
export async function fetchPage(
  supabase: SupabaseClient,
  siteKey: string,
  pageSlug: string,
): Promise<Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const slug = normalizeSlug(pageSlug)

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*, templates(*)')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .maybeSingle()

  if (pageError) {
    const mapped = mapDbError(pageError)
    return errorResponse(mapped.message, mapped.status)
  }

  if (!pageData) {
    return errorResponse(`Page not found: ${slug}`, 404)
  }

  const page = pageData as PageWithTemplate
  const template = page.templates

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) {
    const mapped = mapDbError(fieldsError)
    return errorResponse(mapped.message, mapped.status)
  }

  return jsonResponse(
    buildPageApiPayload(page, template, (fields ?? []) as FieldRow[]),
  )
}

/**
 * Resolves a page row by site key and slug.
 */
export async function resolvePage(
  supabase: SupabaseClient,
  siteKey: string,
  pageSlug: string,
): Promise<PageWithTemplate | Response> {
  const siteId = await resolveSiteId(supabase, siteKey)
  if (siteId instanceof Response) return siteId

  const slug = normalizeSlug(pageSlug)

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*, templates(*)')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .maybeSingle()

  if (pageError) {
    const mapped = mapDbError(pageError)
    return errorResponse(mapped.message, mapped.status)
  }

  if (!pageData) {
    return errorResponse(`Page not found: ${slug}`, 404)
  }

  return pageData as PageWithTemplate
}
