import type { FieldRow } from '../types/cms'

/**
 * Resolves a field by name, optionally scoped to a parent section and/or slice instance.
 */
export function resolveField(
  fields: FieldRow[],
  name: string,
  parentSectionName?: string,
  sliceId?: string | null,
): FieldRow | undefined {
  const scoped = fields.filter((field) =>
    sliceId ? field.slice_id === sliceId : field.slice_id === null,
  )

  if (!parentSectionName) {
    return scoped.find((field) => field.name === name && field.parent_id === null)
  }

  const parent = scoped.find(
    (field) =>
      field.name === parentSectionName &&
      field.type === 'section' &&
      field.parent_id === null,
  )
  if (!parent) return undefined
  return scoped.find(
    (field) => field.name === name && field.parent_id === parent.id,
  )
}

/**
 * Returns ordered field groups for each item in a repeatable array field.
 */
export function resolveArrayItems(
  fields: FieldRow[],
  arrayName: string,
  sliceId?: string | null,
): FieldRow[][] {
  const scoped = fields.filter((field) =>
    sliceId ? field.slice_id === sliceId : field.slice_id === null,
  )

  const arrayField = scoped.find(
    (field) => field.name === arrayName && field.type === 'array',
  )
  if (!arrayField) return []

  const itemSections = scoped
    .filter(
      (field) =>
        field.parent_id === arrayField.id && field.type === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  return itemSections.map((item) =>
    scoped
      .filter((field) => field.parent_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  )
}
