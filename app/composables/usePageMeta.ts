import type { PageRow } from '~/types/cms'

export interface PageMetaInput {
  title?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image?: string | null
  noindex?: boolean
}

/**
 * Updates page meta columns in Supabase.
 */
export async function updatePageMeta(
  pageId: string,
  meta: PageMetaInput,
): Promise<PageRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('pages')
    .update(meta)
    .eq('id', pageId)
    .select('*')
    .single()

  if (error) throw error
  return data as PageRow
}
