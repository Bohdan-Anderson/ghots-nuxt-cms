import type { FieldRow } from '../types/cms'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Seeds one array item section under an array field (children ensured lazily from DOM).
 */
export async function seedArrayItem(
  supabase: SupabaseClient,
  arrayField: FieldRow,
  itemIndex: number,
): Promise<FieldRow[]> {
  const { data: inserted, error } = await supabase
    .from('fields')
    .insert({
      page_id: arrayField.page_id,
      global_id: arrayField.global_id,
      parent_id: arrayField.id,
      name: `item_${itemIndex}`,
      kind: 'section',
      plain_text: null,
      richtext: null,
      link: null,
      image: null,
      sort_order: itemIndex,
    })
    .select('*')
    .single()

  if (error) throw error
  return [inserted as FieldRow]
}
