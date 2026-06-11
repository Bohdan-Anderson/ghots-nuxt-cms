import type { FieldRow, PageContent } from '~/types/cms'
import type { ResolvedFieldManifestEntry } from '~/fields/resolveManifestFieldType'
import { defaultValueForFieldType } from '~/fields/defaultValues'
import { resolveField } from '~/fields/resolveField'
import {
  canMigrateFieldType,
  isValueMalformedForType,
  migrateFieldValue,
} from '~/fields/migrateFieldValue'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Returns true when a field row has child rows in the flat list.
 */
export function fieldHasChildren(
  fieldId: string,
  fields: FieldRow[],
): boolean {
  return fields.some((row) => row.parent_id === fieldId)
}

/**
 * Resolves the parent section row id for a manifest entry, ensuring the section exists.
 */
async function ensureParentSectionId(
  supabase: SupabaseClient,
  content: PageContent,
  entry: ResolvedFieldManifestEntry,
  fields: FieldRow[],
): Promise<string | null> {
  if (!entry.parentName) return null

  const parentEntry: ResolvedFieldManifestEntry = {
    name: entry.parentName,
    type: 'section',
    sliceId: entry.sliceId,
    sliceTypeKey: entry.sliceTypeKey,
    parentName: null,
    sortOrder: entry.sortOrder,
  }

  const parent = await ensureField(supabase, content, parentEntry, fields)
  return parent?.id ?? null
}

/**
 * Inserts or updates a single field row to match a manifest entry.
 */
export async function ensureField(
  supabase: SupabaseClient,
  content: PageContent,
  entry: ResolvedFieldManifestEntry,
  fields: FieldRow[],
): Promise<FieldRow | null> {
  const sliceId = entry.sliceId ?? null
  const existing = resolveField(
    fields,
    entry.name,
    entry.parentName ?? undefined,
    sliceId,
  )

  if (!existing) {
    const parentId = await ensureParentSectionId(
      supabase,
      content,
      entry,
      fields,
    )

    const { data: inserted, error } = await supabase
      .from('fields')
      .insert({
        page_id: content.page.id,
        slice_id: sliceId,
        global_id: null,
        parent_id: parentId,
        name: entry.name,
        type: entry.type,
        value: defaultValueForFieldType(entry.type),
        sort_order: entry.sortOrder,
      })
      .select('*')
      .single()

    if (error) throw error
    return inserted as FieldRow
  }

  const hasChildren = fieldHasChildren(existing.id, fields)
  let nextType = existing.type
  let nextValue = existing.value

  if (existing.type !== entry.type) {
    if (!canMigrateFieldType(existing.type, entry.type, hasChildren)) {
      if (import.meta.dev) {
        console.warn(
          `[cms] Skipping type migration for "${entry.name}" (${existing.type} → ${entry.type}): structural conflict`,
        )
      }
      return existing
    }

    nextType = entry.type
    nextValue = migrateFieldValue(existing.type, entry.type, existing.value)
  } else if (isValueMalformedForType(existing.type, existing.value)) {
    nextValue = migrateFieldValue(existing.type, existing.type, existing.value)
  } else {
    return existing
  }

  const { data: updated, error } = await supabase
    .from('fields')
    .update({ type: nextType, value: nextValue })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) throw error
  return updated as FieldRow
}
