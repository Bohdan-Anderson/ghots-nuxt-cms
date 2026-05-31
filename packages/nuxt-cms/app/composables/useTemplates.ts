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
  const { loggedIn } = useAuth()

  return useAsyncData('cms-templates', () => fetchTemplates(), {
    getCachedData(key, nuxtApp) {
      if (loggedIn.value) {
        return undefined
      }
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    },
  })
}
