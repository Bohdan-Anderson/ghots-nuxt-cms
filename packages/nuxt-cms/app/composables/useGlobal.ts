import type { FieldRow, GlobalContent, GlobalRow } from '~/types/cms'
import { getGlobalDefinition } from '#cms/registries'
import { buildFieldMaps } from '~/fields/maps'

/**
 * Loads a global region and its fields.
 */
export async function fetchGlobalContent(
  key: string,
  _options?: { loggedIn?: boolean },
): Promise<GlobalContent | null> {
  const supabase = useSupabase()
  const definition = getGlobalDefinition(key)
  const siteId = await resolveSiteId()

  if (!definition) return null

  const { data: globalData, error: globalError } = await supabase
    .from('globals')
    .select('*')
    .eq('site_id', siteId)
    .eq('key', key)
    .maybeSingle()

  if (globalError) throw globalError

  let global = globalData as GlobalRow | null

  if (!global) {
    const { data: inserted, error: insertError } = await supabase
      .from('globals')
      .insert({
        site_id: siteId,
        key: definition.key,
        label: definition.label,
      })
      .select('*')
      .single()

    if (insertError) throw insertError
    global = inserted as GlobalRow
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('global_id', global.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) throw fieldsError

  const fieldList = (fields ?? []) as FieldRow[]
  const { fieldsById, fieldsByName, fieldsByParentAndName } =
    buildFieldMaps(fieldList)

  return {
    global,
    fields: fieldList,
    fieldsById,
    fieldsByName,
    fieldsByParentAndName,
  }
}

/**
 * Cached global content — prerender payload for guests, live Supabase when logged in.
 */
export function useGlobalData(key: string) {
  const { loggedIn } = useAuth()
  const siteKey = useSiteKey()
  return useGuestCachedAsyncData(`global:${siteKey}:${key}`, () =>
    fetchGlobalContent(key, { loggedIn: loggedIn.value }),
  )
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
