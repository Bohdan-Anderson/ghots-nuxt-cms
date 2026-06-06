import type { FieldRow, PageSliceRow } from '~/types/cms'
import { getSliceDefinition } from '#cms/registries'
import { seedFieldsFromSchema } from '~/composables/seedFields'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Inserts a slice instance on a page and seeds its fields from the code registry.
 */
export async function insertPageSlice(
  pageId: string,
  sliceTypeKey: string,
  sortOrder?: number,
): Promise<{ slice: PageSliceRow; fields: FieldRow[] }> {
  const supabase = useSupabase()
  const definition = getSliceDefinition(sliceTypeKey)

  if (!definition) {
    throw new Error(`Unknown slice type: ${sliceTypeKey}`)
  }

  let order = sortOrder
  if (order === undefined) {
    const { data: existing, error: countError } = await supabase
      .from('page_slices')
      .select('sort_order')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (countError) throw countError
    order = existing?.[0] ? existing[0].sort_order + 1 : 0
  }

  const { data: inserted, error } = await supabase
    .from('page_slices')
    .insert({
      page_id: pageId,
      slice_type_key: sliceTypeKey,
      sort_order: order,
    })
    .select('*')
    .single()

  if (error) throw error

  const slice = inserted as PageSliceRow

  const fields = await seedFieldsFromSchema(supabase, definition.fieldSchema, {
    pageId,
    sliceId: slice.id,
  })

  return { slice, fields }
}

/**
 * Removes a slice instance; slice fields cascade via FK.
 */
export async function deletePageSlice(sliceId: string): Promise<void> {
  const supabase = useSupabase()
  const { error } = await supabase
    .from('page_slices')
    .delete()
    .eq('id', sliceId)

  if (error) throw error
}

/**
 * Reorders slice instances on a page by id list (index = sort_order).
 */
export async function reorderPageSlices(
  pageId: string,
  orderedSliceIds: string[],
): Promise<void> {
  const supabase = useSupabase()

  for (let index = 0; index < orderedSliceIds.length; index++) {
    const { error } = await supabase
      .from('page_slices')
      .update({ sort_order: index })
      .eq('id', orderedSliceIds[index]!)
      .eq('page_id', pageId)

    if (error) throw error
  }
}

/**
 * Loads ordered slice instances for a page.
 */
export async function fetchPageSlices(
  supabase: SupabaseClient,
  pageId: string,
): Promise<PageSliceRow[]> {
  const { data, error } = await supabase
    .from('page_slices')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as PageSliceRow[]
}
