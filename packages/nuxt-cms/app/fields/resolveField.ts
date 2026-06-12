import type { FieldRow } from '../types/cms'
import { parentNameKey } from './maps'

/**
 * Resolves a field by parent id and name from a flat list or lookup map.
 */
export function resolveFieldByParent(
  fieldsByParentAndName: Record<string, FieldRow>,
  parentId: string | null,
  name: string,
): FieldRow | undefined {
  return fieldsByParentAndName[parentNameKey(parentId, name)]
}

/**
 * Resolves a field by parent id and name from a flat field list.
 */
export function resolveField(
  fields: FieldRow[],
  name: string,
  parentId?: string | null,
): FieldRow | undefined {
  const pid = parentId ?? null
  return fields.find(
    (field) => field.name === name && field.parent_id === pid,
  )
}

/**
 * Returns ordered field groups for each item in a repeatable array field.
 */
export function resolveArrayItems(
  fields: FieldRow[],
  arrayFieldId: string,
): FieldRow[][] {
  const arrayField = fields.find(
    (field) => field.id === arrayFieldId && field.kind === 'array',
  )
  if (!arrayField) return []

  const itemSections = fields
    .filter(
      (field) =>
        field.parent_id === arrayField.id && field.kind === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  return itemSections.map((item) =>
    fields
      .filter((field) => field.parent_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  )
}
