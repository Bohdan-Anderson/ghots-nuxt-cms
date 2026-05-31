import type { TemplateRow } from '~/types/cms'

/**
 * Fetches all templates for the page-create picker.
 */
export async function fetchTemplates(): Promise<TemplateRow[]> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('templates')
    .select('id, key, label, field_schema')
    .order('label', { ascending: true })

  if (error) throw error
  return (data ?? []) as TemplateRow[]
}

/**
 * Cached template list for sidebar page creation.
 */
export function useTemplatesData() {
  return useGuestCachedAsyncData('cms-templates', () => fetchTemplates())
}
