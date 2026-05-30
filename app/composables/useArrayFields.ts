import type { FieldRow } from '~/types/cms'
import { getArrayItemSchema } from '~/fields/schemaLookup'
import { seedArrayItem } from '~/composables/seedFields'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Counts existing item sections under an array field.
 */
export function countArrayItems(
  fields: FieldRow[],
  arrayFieldId: string,
): number {
  return fields.filter(
    (field) => field.parent_id === arrayFieldId && field.type === 'section',
  ).length
}

/**
 * Adds a new item to a repeatable array field.
 */
export async function insertArrayItem(arrayFieldId: string): Promise<void> {
  const supabase = useSupabase()
  const { pageContent } = useCmsPanel()
  const content = pageContent.value
  if (!content) return

  const arrayField = content.fieldsById[arrayFieldId]
  if (!arrayField || arrayField.type !== 'array') {
    throw new Error('Field is not a repeatable array')
  }

  const itemSchema = getArrayItemSchema(content, arrayField)
  const nextIndex = countArrayItems(content.fields, arrayFieldId)

  await seedArrayItem(supabase, arrayField, nextIndex, itemSchema)
}

/**
 * Removes an array item section and its child fields (cascade).
 */
export async function deleteArrayItem(itemSectionId: string): Promise<void> {
  const supabase = useSupabase()
  const { error } = await supabase
    .from('fields')
    .delete()
    .eq('id', itemSectionId)

  if (error) throw error
}
