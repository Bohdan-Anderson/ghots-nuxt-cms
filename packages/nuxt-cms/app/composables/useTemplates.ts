import type { TemplateRow } from '~/types/cms'

/**
 * Fetches all templates for the page-create picker.
 */
export async function fetchTemplates(): Promise<TemplateRow[]> {
  const supabase = useSupabase()
  const siteId = await resolveSiteId()
  const { data, error } = await supabase
    .from('templates')
    .select('id, site_id, key, label, field_schema')
    .eq('site_id', siteId)
    .order('label', { ascending: true })

  if (error) throw error
  return (data ?? []) as TemplateRow[]
}

/**
 * Cached template list for sidebar page creation.
 */
export function useTemplatesData() {
  const siteKey = useSiteKey()
  return useGuestCachedAsyncData(`cms-templates:${siteKey}`, () =>
    fetchTemplates(),
  )
}
