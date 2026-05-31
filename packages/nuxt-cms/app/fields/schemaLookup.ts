import type { FieldRow, FieldSchemaNode, PageContent } from '~/types/cms'
import { getSliceDefinition } from '#cms/registries'

/**
 * Returns the root field schema for a field (template page-level or slice registry).
 */
function schemaRootForField(
  content: PageContent,
  field: FieldRow,
): FieldSchemaNode[] {
  if (field.slice_id) {
    const slice = content.slices.find((row) => row.id === field.slice_id)
    if (!slice) return []
    return getSliceDefinition(slice.slice_type_key)?.fieldSchema ?? []
  }
  return content.template.field_schema
}

/**
 * Finds a schema node by name at the current tree level.
 */
function findSchemaNode(
  schema: FieldSchemaNode[],
  name: string,
): FieldSchemaNode | null {
  return schema.find((node) => node.name === name) ?? null
}

/**
 * Returns the item field schema for an `array` field instance.
 */
export function getArrayItemSchema(
  content: PageContent,
  arrayField: FieldRow,
): FieldSchemaNode[] {
  if (arrayField.type !== 'array') return []

  const root = schemaRootForField(content, arrayField)
  const node = findSchemaNode(root, arrayField.name)
  return node?.children ?? []
}

/**
 * Returns true when a section row is an array item (parent is type `array`).
 */
export function isArrayItemSection(
  field: FieldRow,
  fieldsById: Record<string, FieldRow>,
): boolean {
  if (field.type !== 'section' || !field.parent_id) return false
  const parent = fieldsById[field.parent_id]
  return parent?.type === 'array'
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
      (field) =>
        field.parent_id === arrayField.id && field.type === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  const index = siblings.findIndex((field) => field.id === itemSection.id)
  return `Item ${index >= 0 ? index + 1 : '?'}`
}
