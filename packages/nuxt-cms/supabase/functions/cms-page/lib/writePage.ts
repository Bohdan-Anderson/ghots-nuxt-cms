import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { flattenFields, validateNestedFields } from './fieldTree.ts'
import { fetchPage, resolvePage } from './fetchPage.ts'
import { errorResponse, mapDbError } from './response.ts'
import type { FieldRow, PageApiContent, PageMetaInput } from './types.ts'

const META_KEYS = [
  'title',
  'meta_title',
  'meta_description',
  'og_image',
  'noindex',
] as const

/**
 * Extracts writable page meta fields from a page API payload.
 */
function extractPageMeta(content: PageApiContent): PageMetaInput {
  const meta: PageMetaInput = {}
  const page = content.page

  for (const key of META_KEYS) {
    if (key in page) {
      meta[key] = page[key]
    }
  }

  return meta
}

/**
 * Strips a field row to insertable/updateable columns.
 */
function toFieldRow(field: FieldRow, pageId: string, id?: string): FieldRow {
  return {
    id: id ?? field.id,
    page_id: pageId,
    global_id: null,
    parent_id: field.parent_id,
    name: field.name,
    kind: field.kind,
    plain_text: field.plain_text,
    richtext: field.richtext,
    link: field.link,
    image: field.image,
    sort_order: field.sort_order,
  }
}

/**
 * Sorts flat fields so parents are inserted before children.
 */
function sortFieldsForInsert(fields: FieldRow[]): FieldRow[] {
  const byId = new Map(fields.map((field) => [field.id, field]))

  const depth = (field: FieldRow, seen = new Set<string>()): number => {
    if (!field.parent_id) return 0
    if (seen.has(field.id)) return 0
    seen.add(field.id)
    const parent = byId.get(field.parent_id)
    if (!parent) {
      throw new Error(`parent_id ${field.parent_id} not found in payload`)
    }
    return depth(parent, seen) + 1
  }

  return [...fields].sort((a, b) => depth(a) - depth(b))
}

/**
 * Updates page meta columns in Supabase.
 */
async function updatePageMeta(
  supabase: SupabaseClient,
  pageId: string,
  meta: PageMetaInput,
): Promise<Response | null> {
  if (Object.keys(meta).length === 0) return null

  const { error } = await supabase.from('pages').update(meta).eq('id', pageId)

  if (error) {
    const mapped = mapDbError(error)
    return errorResponse(mapped.message, mapped.status)
  }

  return null
}

/**
 * Flattens nested API fields to DB rows for the given page.
 */
function nestedToFlat(
  content: PageApiContent,
  pageId: string,
): FieldRow[] | Response {
  const validationError = validateNestedFields(content.fields ?? [])
  if (validationError) return errorResponse(validationError, 400)

  return flattenFields(content.fields ?? [], pageId)
}

/**
 * PUT — merge page meta and upsert fields by id.
 */
export async function putPage(
  supabase: SupabaseClient,
  siteKey: string,
  pageSlug: string,
  content: PageApiContent,
): Promise<Response> {
  const page = await resolvePage(supabase, siteKey, pageSlug)
  if (page instanceof Response) return page

  const flatOrError = nestedToFlat(content, page.id)
  if (flatOrError instanceof Response) return flatOrError

  const metaError = await updatePageMeta(
    supabase,
    page.id,
    extractPageMeta(content),
  )
  if (metaError) return metaError

  const { data: existingFields, error: existingError } = await supabase
    .from('fields')
    .select('id')
    .eq('page_id', page.id)

  if (existingError) {
    const mapped = mapDbError(existingError)
    return errorResponse(mapped.message, mapped.status)
  }

  const existingIds = new Set((existingFields ?? []).map((row) => row.id))

  for (const field of flatOrError) {
    const row = toFieldRow(field, page.id)

    if (field.id && existingIds.has(field.id)) {
      const { error } = await supabase
        .from('fields')
        .update({
          parent_id: row.parent_id,
          name: row.name,
          kind: row.kind,
          plain_text: row.plain_text,
          richtext: row.richtext,
          link: row.link,
          image: row.image,
          sort_order: row.sort_order,
        })
        .eq('id', field.id)
        .eq('page_id', page.id)

      if (error) {
        const mapped = mapDbError(error)
        return errorResponse(mapped.message, mapped.status)
      }
    } else {
      const insertRow = field.id
        ? row
        : { ...row, id: crypto.randomUUID() }

      const { error } = await supabase.from('fields').insert(insertRow)

      if (error) {
        const mapped = mapDbError(error)
        return errorResponse(mapped.message, mapped.status)
      }
    }
  }

  return fetchPage(supabase, siteKey, pageSlug)
}

/**
 * POST — replace all page fields with the payload.
 */
export async function postPage(
  supabase: SupabaseClient,
  siteKey: string,
  pageSlug: string,
  content: PageApiContent,
): Promise<Response> {
  const page = await resolvePage(supabase, siteKey, pageSlug)
  if (page instanceof Response) return page

  const flatOrError = nestedToFlat(content, page.id)
  if (flatOrError instanceof Response) return flatOrError

  const metaError = await updatePageMeta(
    supabase,
    page.id,
    extractPageMeta(content),
  )
  if (metaError) return metaError

  const { error: deleteError } = await supabase
    .from('fields')
    .delete()
    .eq('page_id', page.id)

  if (deleteError) {
    const mapped = mapDbError(deleteError)
    return errorResponse(mapped.message, mapped.status)
  }

  if (flatOrError.length > 0) {
    let sorted: FieldRow[]
    try {
      sorted = sortFieldsForInsert(flatOrError)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid field tree'
      return errorResponse(message, 400)
    }

    for (const field of sorted) {
      const row = toFieldRow(field, page.id, field.id || crypto.randomUUID())

      const { error } = await supabase.from('fields').insert(row)

      if (error) {
        const mapped = mapDbError(error)
        return errorResponse(mapped.message, mapped.status)
      }
    }
  }

  return fetchPage(supabase, siteKey, pageSlug)
}
