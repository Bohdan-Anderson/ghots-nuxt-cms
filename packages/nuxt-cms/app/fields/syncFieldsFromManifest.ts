import type { FieldRow, PageContent } from '~/types/cms'
import type {
  RawFieldManifestEntry,
  ResolvedFieldManifestEntry,
} from '~/fields/resolveManifestFieldType'
import {
  canSyncManifestEntry,
  resolveManifestFieldType,
} from '~/fields/resolveManifestFieldType'
import { ensureField } from '~/fields/ensureField'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Sorts manifest entries so section parents are processed before children.
 */
export function sortManifestEntries(
  entries: ResolvedFieldManifestEntry[],
): ResolvedFieldManifestEntry[] {
  return [...entries].sort((a, b) => {
    if (a.type === 'section' && b.type !== 'section') return -1
    if (b.type === 'section' && a.type !== 'section') return 1
    if (a.parentName && !b.parentName) return 1
    if (!a.parentName && b.parentName) return -1
    return a.sortOrder - b.sortOrder
  })
}

/**
 * Resolves raw manifest rows to fully typed entries.
 */
export function resolveManifestEntries(
  manifest: RawFieldManifestEntry[],
  content: PageContent,
): ResolvedFieldManifestEntry[] {
  return manifest
    .filter((entry) => canSyncManifestEntry(entry, content))
    .map((entry) => ({
      ...entry,
      type: resolveManifestFieldType(entry, content),
    }))
}

/**
 * Ensures all manifest fields exist in Supabase with correct types and values.
 */
export async function syncFieldsFromManifest(
  supabase: SupabaseClient,
  content: PageContent,
  manifest: RawFieldManifestEntry[],
): Promise<FieldRow[]> {
  const resolved = sortManifestEntries(
    resolveManifestEntries(manifest, content),
  )

  if (resolved.length === 0) return []

  const fields = [...content.fields]
  const changed: FieldRow[] = []

  for (const entry of resolved) {
    const beforeIds = new Set(fields.map((row) => row.id))
    const result = await ensureField(supabase, content, entry, fields)

    if (!result) continue

    const existingIndex = fields.findIndex((row) => row.id === result.id)
    if (existingIndex >= 0) {
      fields[existingIndex] = result
    } else {
      fields.push(result)
    }

    const wasNew = !beforeIds.has(result.id)
    const previous = content.fields.find((row) => row.id === result.id)
    const typeChanged = previous && previous.type !== result.type
    const valueChanged = previous && previous.value !== result.value

    if (wasNew || typeChanged || valueChanged) {
      changed.push(result)
    }
  }

  return changed
}

/**
 * Ensures a single manifest entry and returns the resulting row if changed.
 */
export async function ensureFieldFromManifestEntry(
  supabase: SupabaseClient,
  content: PageContent,
  entry: RawFieldManifestEntry,
): Promise<FieldRow | null> {
  if (!canSyncManifestEntry(entry, content)) return null

  const resolved: ResolvedFieldManifestEntry = {
    ...entry,
    type: resolveManifestFieldType(entry, content),
  }

  const result = await ensureField(
    supabase,
    content,
    resolved,
    content.fields,
  )

  return result
}
