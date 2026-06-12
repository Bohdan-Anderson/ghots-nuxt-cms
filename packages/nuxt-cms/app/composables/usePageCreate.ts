import type { PageRow } from '~/types/cms'
import { normalizeSlug } from '~/utils/slug'

export interface CreatePageInput {
  slug: string
  title: string
  templateId: string
}

/**
 * Returns true if a page with this slug already exists.
 */
export async function slugExists(slug: string): Promise<boolean> {
  const supabase = useSupabase()
  const normalized = normalizeSlug(slug)
  const siteId = await resolveSiteId()
  const { data, error } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', normalized)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/**
 * Creates a page. Fields are ensured lazily from DOM when editors visit.
 */
export async function createPage(input: CreatePageInput): Promise<PageRow> {
  const supabase = useSupabase()
  const slug = normalizeSlug(input.slug)
  const siteId = await resolveSiteId()

  if (await slugExists(slug)) {
    throw new Error(`A page with slug "${slug}" already exists.`)
  }

  const { data: inserted, error } = await supabase
    .from('pages')
    .insert({
      site_id: siteId,
      slug,
      template_id: input.templateId,
      title: input.title.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return inserted as PageRow
}

/**
 * Deletes a page; field rows cascade via FK.
 */
export async function deletePage(pageId: string): Promise<void> {
  const supabase = useSupabase()
  const { error } = await supabase.from('pages').delete().eq('id', pageId)

  if (error) throw error
}
