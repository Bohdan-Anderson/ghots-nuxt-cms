import type {
  FieldRow,
  PageContent,
  PageRow,
  TemplateRow,
} from '~/types/cms'
import {
  buildFieldMaps,
  loadFieldsForOwner,
  pageLevelFields,
} from '~/composables/seedFields'
import { fetchPageSlices } from '~/composables/usePageSlices'
import { normalizeSlug } from '~/utils/slug'

/**
 * Fetches page + template + slices + fields; seeds empty page-level fields for logged-in editors.
 */
export async function usePageContent(
  slugInput: string,
  options?: { loggedIn?: boolean },
): Promise<PageContent | null> {
  const supabase = useSupabase()
  const loggedIn = options?.loggedIn ?? false
  const slug = normalizeSlug(slugInput)

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*, templates(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (pageError) throw pageError
  if (!pageData) return null

  const page = pageData as PageRow & { templates: TemplateRow }
  const template = page.templates

  const slices = await fetchPageSlices(supabase, page.id)

  const fieldList = await loadFieldsForOwner(supabase, 'page_id', page.id, {
    seedWhenLoggedInAndEmpty: loggedIn,
    schema: template.field_schema,
    seedContext: { pageId: page.id },
    isEmpty: (rows) => rows.filter((f) => f.slice_id === null).length === 0,
  })
  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fieldList)

  return buildPageContentPayload(
    page,
    template,
    slices,
    fieldList,
    fieldsById,
    fieldsByName,
    fieldsBySliceId,
  )
}

/**
 * Fetches all fields for a page (sidebar patch after array insert).
 */
export async function fetchFieldsForPage(pageId: string): Promise<FieldRow[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as FieldRow[]
}

/**
 * Fetches fields for one slice instance (sidebar patch after add slice).
 */
export async function fetchFieldsForSlice(sliceId: string): Promise<FieldRow[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('slice_id', sliceId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as FieldRow[]
}

/**
 * Returns a JSON-serializable page payload for useAsyncData / prerender.
 */
export function buildPageContentPayload(
  page: PageRow,
  template: TemplateRow,
  slices: PageContent['slices'],
  fields: FieldRow[],
  fieldsById: Record<string, FieldRow>,
  fieldsByName: Record<string, FieldRow>,
  fieldsBySliceId: Record<string, FieldRow[]>,
): PageContent {
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
    slices,
    fields,
    pageFields: pageLevelFields(fields),
    fieldsBySliceId,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Updates a field value in Supabase.
 */
export async function updateFieldValue(
  fieldId: string,
  value: string,
): Promise<FieldRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .update({ value })
    .eq('id', fieldId)
    .select('*')
    .single()

  if (error) throw error
  return data as FieldRow
}
