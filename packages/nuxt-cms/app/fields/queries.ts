import type { FieldRow } from '../types/cms'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Fetches all fields for a page, ordered by sort_order.
 */
export async function fetchFieldsForPage(
  supabase: SupabaseClient,
  pageId: string,
): Promise<FieldRow[]> {
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as FieldRow[]
}
