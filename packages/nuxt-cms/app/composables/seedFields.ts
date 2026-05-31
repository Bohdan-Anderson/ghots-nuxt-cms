import type {
  FieldRow,
  FieldSchemaNode,
  PageContent,
  PageSliceRow,
} from '../types/cms'
import { defaultValueForFieldType } from '../fields/defaultValues'

type SupabaseClient = ReturnType<typeof useSupabase>

export interface SeedFieldsContext {
  pageId?: string
  sliceId?: string
  globalId?: string
}

/**
 * Seeds one array item section and its child fields under an array field.
 */
export async function seedArrayItem(
  supabase: SupabaseClient,
  arrayField: FieldRow,
  itemIndex: number,
  itemSchema: FieldSchemaNode[],
): Promise<FieldRow> {
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

  if (itemSchema.length > 0) {
    await seedFieldsFromSchema(
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
  }

  return itemSection
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
      .select('*')
      .single()

    if (error) throw error

    const insertedField = inserted as FieldRow

    if (node.type === 'array' && node.children?.length) {
      await seedArrayItem(supabase, insertedField, 0, node.children)
    } else if (node.type === 'section' && node.children?.length) {
      await seedFieldsFromSchema(
        supabase,
        node.children,
        context,
        insertedField.id,
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

/**
 * Rebuilds derived maps after slices or fields change (sidebar structural edits).
 */
export function rebuildPageContent(
  current: PageContent,
  updates: {
    fields?: FieldRow[]
    slices?: PageSliceRow[]
    page?: PageContent['page']
  },
): PageContent {
  const fields = updates.fields ?? current.fields
  const slices = updates.slices ?? current.slices
  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fields)

  return {
    ...current,
    page: updates.page ?? current.page,
    fields,
    slices,
    pageFields: pageLevelFields(fields),
    fieldsBySliceId,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Collects a root field id and all descendant field ids from a flat list.
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
 * Loads fields for a page or global row; optionally seeds from schema when empty.
 */
export async function loadFieldsForOwner(
  supabase: SupabaseClient,
  ownerColumn: 'page_id' | 'global_id',
  ownerId: string,
  options: LoadFieldsForOwnerOptions = {},
): Promise<FieldRow[]> {
  let { data: fields, error } = await supabase
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
    await seedFieldsFromSchema(supabase, options.schema!, options.seedContext!)
    const refetch = await supabase
      .from('fields')
      .select('*')
      .eq(ownerColumn, ownerId)
      .order('sort_order', { ascending: true })
    if (refetch.error) throw refetch.error
    return (refetch.data ?? []) as FieldRow[]
  }

  return fieldList
}

export function collectFieldSubtreeIds(
  fields: FieldRow[],
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId])
  let growth = true
  while (growth) {
    growth = false
    for (const field of fields) {
      if (
        field.parent_id &&
        ids.has(field.parent_id) &&
        !ids.has(field.id)
      ) {
        ids.add(field.id)
        growth = true
      }
    }
  }
  return ids
}
