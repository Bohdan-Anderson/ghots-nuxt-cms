import type { FieldRow } from '~/types/cms'

/**
 * Returns true when a section row is an array item (parent kind is `array`).
 */
export function isArrayItemSection(
  field: FieldRow,
  fieldsById: Record<string, FieldRow>,
): boolean {
  if (field.kind !== 'section' || !field.parent_id) return false
  const parent = fieldsById[field.parent_id]
  return parent?.kind === 'array'
}

/**
 * Human-readable label for an array item section row.
 */
export function arrayItemLabel(
  itemSection: FieldRow,
  arrayField: FieldRow,
  fields: FieldRow[],
): string {
  const siblings = fields
    .filter(
      (field) => field.parent_id === arrayField.id && field.kind === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  const index = siblings.findIndex((field) => field.id === itemSection.id)
  return `Item ${index >= 0 ? index + 1 : '?'}`
}
