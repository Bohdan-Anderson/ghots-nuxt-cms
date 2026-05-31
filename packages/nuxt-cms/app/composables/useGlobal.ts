import type {
  FieldRow,
  GlobalContent,
  GlobalRow,
} from '~/types/cms'
import { getGlobalDefinition } from '#cms/registries'
import { buildFieldMaps, seedFieldsFromSchema } from '~/composables/seedFields'

/**
 * Loads a global region and its fields; seeds from code registry when logged in and empty.
 */
export async function fetchGlobalContent(
  key: string,
): Promise<GlobalContent | null> {
  const supabase = useSupabase()
  const { loggedIn } = useAuth()
  const definition = getGlobalDefinition(key)

  if (!definition) return null

  const { data: globalData, error: globalError } = await supabase
    .from('globals')
    .select('*')
    .eq('key', key)
    .maybeSingle()

  if (globalError) throw globalError

  let global = globalData as GlobalRow | null

  if (!global && loggedIn.value) {
    const { data: inserted, error: insertError } = await supabase
      .from('globals')
      .insert({ key: definition.key, label: definition.label })
      .select('*')
      .single()

    if (insertError) throw insertError
    global = inserted as GlobalRow
  }

  if (!global) return null

  let { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('global_id', global.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) throw fieldsError

  if (loggedIn.value && (!fields || fields.length === 0)) {
    await seedFieldsFromSchema(supabase, definition.fieldSchema, {
      globalId: global.id,
    })
    const refetch = await supabase
      .from('fields')
      .select('*')
      .eq('global_id', global.id)
      .order('sort_order', { ascending: true })
    if (refetch.error) throw refetch.error
    fields = refetch.data
  }

  const fieldList = (fields ?? []) as FieldRow[]
  const { fieldsById, fieldsByName } = buildFieldMaps(fieldList)

  return {
    global,
    fields: fieldList,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Cached global content — prerender payload for guests, live Supabase when logged in.
 */
export function useGlobalData(key: string) {
  const { loggedIn } = useAuth()

  return useAsyncData(`global:${key}`, () => fetchGlobalContent(key), {
    getCachedData(cacheKey, nuxtApp) {
      if (loggedIn.value) {
        return undefined
      }
      return nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]
    },
  })
}

/**
 * Resolves a root-level global field by name.
 */
export function resolveGlobalField(
  fields: FieldRow[],
  name: string,
): FieldRow | undefined {
  return fields.find((field) => field.name === name && field.parent_id === null)
}

/**
 * Updates a global field value in Supabase.
 */
export async function updateGlobalFieldValue(
  fieldId: string,
  value: string,
): Promise<FieldRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .update({ value })
    .eq('id', fieldId)
    .select('*')
    .single()

  if (error) throw error
  return data as FieldRow
}
