import type { FieldRow, FieldSchemaNode } from '~/types/cms'
import { defaultValueForFieldType } from '~/fields/registry'

type SupabaseClient = ReturnType<typeof useSupabase>

export interface SeedFieldsContext {
  pageId?: string
  sliceId?: string
  globalId?: string
}

/**
 * Inserts field rows from a schema tree (page-level, slice instance, or global).
 */
export async function seedFieldsFromSchema(
  supabase: SupabaseClient,
  schema: FieldSchemaNode[],
  context: SeedFieldsContext,
  parentId: string | null = null,
  startOrder = 0,
): Promise<void> {
  let order = startOrder

  for (const node of schema) {
    const { data: inserted, error } = await supabase
      .from('fields')
      .insert({
        page_id: context.pageId ?? null,
        slice_id: context.sliceId ?? null,
        global_id: context.globalId ?? null,
        parent_id: parentId,
        name: node.name,
        type: node.type,
        value: defaultValueForFieldType(node.type, node.default),
        sort_order: order++,
      })
      .select('id')
      .single()

    if (error) throw error

    if (node.type === 'section' && node.children?.length) {
      await seedFieldsFromSchema(
        supabase,
        node.children,
        context,
        inserted.id,
        0,
      )
    }
  }
}

/**
 * Builds lookup maps from a flat field list.
 */
export function buildFieldMaps(fields: FieldRow[]) {
  const fieldsById: Record<string, FieldRow> = {}
  const fieldsByName: Record<string, FieldRow> = {}
  const fieldsBySliceId: Record<string, FieldRow[]> = {}

  for (const field of fields) {
    fieldsById[field.id] = field

    if (field.slice_id) {
      if (!fieldsBySliceId[field.slice_id]) {
        fieldsBySliceId[field.slice_id] = []
      }
      fieldsBySliceId[field.slice_id]!.push(field)
    }

    if (field.parent_id === null && field.slice_id === null) {
      fieldsByName[field.name] = field
    }
  }

  for (const sliceId of Object.keys(fieldsBySliceId)) {
    fieldsBySliceId[sliceId]!.sort((a, b) => a.sort_order - b.sort_order)
  }

  return { fieldsById, fieldsByName, fieldsBySliceId }
}

/**
 * Returns page-level fields (`slice_id` is null).
 */
export function pageLevelFields(fields: FieldRow[]): FieldRow[] {
  return fields.filter((field) => field.slice_id === null)
}
