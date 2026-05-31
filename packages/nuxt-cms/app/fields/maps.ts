import type { FieldRow } from '../types/cms'

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
 * Collects a root field id and all descendant field ids from a flat list.
 */
export function collectFieldSubtreeIds(
  fields: FieldRow[],
  rootId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>()

  for (const field of fields) {
    if (!field.parent_id) continue
    const siblings = childrenByParent.get(field.parent_id) ?? []
    siblings.push(field.id)
    childrenByParent.set(field.parent_id, siblings)
  }

  const ids = new Set<string>()
  const stack = [rootId]

  while (stack.length > 0) {
    const id = stack.pop()!
    if (ids.has(id)) continue
    ids.add(id)
    for (const childId of childrenByParent.get(id) ?? []) {
      stack.push(childId)
    }
  }

  return ids
}

/**
 * Returns field rows that belong to a subtree rooted at `rootId`.
 */
export function collectFieldSubtree(
  fields: FieldRow[],
  rootId: string,
): FieldRow[] {
  const ids = collectFieldSubtreeIds(fields, rootId)
  return fields.filter((field) => ids.has(field.id))
}
