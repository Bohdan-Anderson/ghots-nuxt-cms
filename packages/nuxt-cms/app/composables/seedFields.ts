import type { FieldRow, FieldSchemaNode } from '../types/cms'
import { defaultValueForFieldType } from '../fields/defaultValues'

type SupabaseClient = ReturnType<typeof useSupabase>

export interface SeedFieldsContext {
  pageId?: string
  sliceId?: string
  globalId?: string
}

/**
 * Options for {@link loadFieldsForOwner}.
 */
export interface LoadFieldsForOwnerOptions {
  /** When true and editor is logged in, seeds `schema` if `isEmpty` returns true. */
  seedWhenLoggedInAndEmpty?: boolean
  schema?: FieldSchemaNode[]
  seedContext?: SeedFieldsContext
  /** Defaults to no fields at all (globals). Use page-level check for pages. */
  isEmpty?: (fields: FieldRow[]) => boolean
}

/**
 * Seeds one array item section and its child fields under an array field.
 */
export async function seedArrayItem(
  supabase: SupabaseClient,
  arrayField: FieldRow,
  itemIndex: number,
  itemSchema: FieldSchemaNode[],
): Promise<FieldRow[]> {
  const { data: inserted, error } = await supabase
    .from('fields')
    .insert({
      page_id: arrayField.page_id,
      slice_id: arrayField.slice_id,
      global_id: arrayField.global_id,
      parent_id: arrayField.id,
      name: `item_${itemIndex}`,
      type: 'section',
      value: null,
      sort_order: itemIndex,
    })
    .select('*')
    .single()

  if (error) throw error

  const itemSection = inserted as FieldRow
  const rows: FieldRow[] = [itemSection]

  if (itemSchema.length > 0) {
    const childRows = await seedFieldsFromSchema(
      supabase,
      itemSchema,
      {
        pageId: arrayField.page_id ?? undefined,
        sliceId: arrayField.slice_id ?? undefined,
        globalId: arrayField.global_id ?? undefined,
      },
      itemSection.id,
      0,
    )
    rows.push(...childRows)
  }

  return rows
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
): Promise<FieldRow[]> {
  const insertedRows: FieldRow[] = []
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
      .select('*')
      .single()

    if (error) throw error

    const insertedField = inserted as FieldRow
    insertedRows.push(insertedField)

    if (node.type === 'array' && node.children?.length) {
      const itemRows = await seedArrayItem(
        supabase,
        insertedField,
        0,
        node.children,
      )
      insertedRows.push(...itemRows)
    } else if (node.type === 'section' && node.children?.length) {
      const childRows = await seedFieldsFromSchema(
        supabase,
        node.children,
        context,
        insertedField.id,
        0,
      )
      insertedRows.push(...childRows)
    }
  }

  return insertedRows
}

/**
 * Loads fields for a page or global row; optionally seeds from schema when empty.
 */
export async function loadFieldsForOwner(
  supabase: SupabaseClient,
  ownerColumn: 'page_id' | 'global_id',
  ownerId: string,
  options: LoadFieldsForOwnerOptions = {},
): Promise<FieldRow[]> {
  const { data: fields, error } = await supabase
    .from('fields')
    .select('*')
    .eq(ownerColumn, ownerId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const fieldList = (fields ?? []) as FieldRow[]
  const empty = options.isEmpty ?? ((rows) => rows.length === 0)
  const shouldSeed =
    options.seedWhenLoggedInAndEmpty &&
    options.schema &&
    options.seedContext &&
    empty(fieldList)

  if (shouldSeed) {
    const seeded = await seedFieldsFromSchema(
      supabase,
      options.schema!,
      options.seedContext!,
    )
    const sliceFields =
      ownerColumn === 'page_id'
        ? fieldList.filter((field) => field.slice_id !== null)
        : []
    return [...sliceFields, ...seeded].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
  }

  return fieldList
}
