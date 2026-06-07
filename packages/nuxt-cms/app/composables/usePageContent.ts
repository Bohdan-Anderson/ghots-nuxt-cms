import type {
  FieldRow,
  PageContent,
  PageRow,
  TemplateRow,
} from '~/types/cms'
import { buildPageContentPayload } from '~/fields/pageContent'
import { loadFieldsForOwner } from '~/composables/seedFields'
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
  const siteId = await resolveSiteId()

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*, templates(*)')
    .eq('site_id', siteId)
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

  return buildPageContentPayload(page, template, slices, fieldList)
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
