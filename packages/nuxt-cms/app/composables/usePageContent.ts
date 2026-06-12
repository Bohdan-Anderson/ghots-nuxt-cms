import type { FieldRow, PageContent, PageRow, TemplateRow } from '~/types/cms'
import { buildPageContentPayload } from '~/fields/pageContent'

/**
 * Fetches page + template + fields for a slug.
 */
export async function usePageContent(
  slugInput: string,
  _options?: { loggedIn?: boolean },
): Promise<PageContent | null> {
  const supabase = useSupabase()
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

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) throw fieldsError

  return buildPageContentPayload(
    page,
    template,
    (fields ?? []) as FieldRow[],
  )
}

/**
 * Updates a typed value column on a field row in Supabase.
 */
export async function updateFieldColumn(
  fieldId: string,
  column: keyof Pick<FieldRow, 'plain_text' | 'richtext' | 'link' | 'image'>,
  value: string,
): Promise<FieldRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .update({ [column]: value })
    .eq('id', fieldId)
    .select('*')
    .single()

  if (error) throw error
  return data as FieldRow
}
