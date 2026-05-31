import type { FieldRow, PageContent } from '~/types/cms'
import { getArrayItemSchema } from '~/fields/schemaLookup'
import { seedArrayItem } from '~/composables/seedFields'

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
 * Adds a new item to a repeatable array field; returns the new field subtree rows.
 */
export async function insertArrayItem(
  content: PageContent,
  arrayFieldId: string,
): Promise<FieldRow[]> {
  const supabase = useSupabase()
  const arrayField = content.fieldsById[arrayFieldId]
  if (!arrayField || arrayField.type !== 'array') {
    throw new Error('Field is not a repeatable array')
  }

  const itemSchema = getArrayItemSchema(content, arrayField)
  const nextIndex = countArrayItems(content.fields, arrayFieldId)

  return seedArrayItem(supabase, arrayField, nextIndex, itemSchema)
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
