import type { FieldSchemaNode, FieldType, PageContent } from '~/types/cms'
import { getSliceDefinition } from '#cms/registries'

/**
 * Raw manifest row collected from DOM before type resolution.
 */
export interface RawFieldManifestEntry {
  name: string
  declaredType?: FieldType
  sliceId?: string | null
  sliceTypeKey?: string | null
  parentName?: string | null
  sortOrder: number
}

/**
 * Manifest row with resolved field type.
 */
export interface ResolvedFieldManifestEntry extends RawFieldManifestEntry {
  type: FieldType
}

const FIELD_TYPES: FieldType[] = [
  'section',
  'plain_text',
  'link',
  'richtext',
  'image',
  'array',
]

/**
 * Parses a data-type attribute into a supported FieldType.
 */
export function parseDeclaredFieldType(value: string | undefined): FieldType | undefined {
  if (!value) return undefined
  return FIELD_TYPES.includes(value as FieldType)
    ? (value as FieldType)
    : undefined
}

/**
 * Finds a schema node by name at the root or under a named section parent.
 */
export function findSchemaNodeByPath(
  schema: FieldSchemaNode[],
  name: string,
  parentName?: string | null,
): FieldSchemaNode | null {
  if (!parentName) {
    return schema.find((node) => node.name === name) ?? null
  }

  const parent = schema.find(
    (node) => node.name === parentName && node.type === 'section',
  )
  if (!parent?.children?.length) return null
  return parent.children.find((node) => node.name === name) ?? null
}

/**
 * Resolves field type using data-type, slice registry, template schema, then plain_text.
 */
export function resolveManifestFieldType(
  entry: RawFieldManifestEntry,
  content: PageContent,
): FieldType {
  if (entry.declaredType) return entry.declaredType

  if (entry.sliceId && entry.sliceTypeKey) {
    const sliceSchema =
      getSliceDefinition(entry.sliceTypeKey)?.fieldSchema ?? []
    const node = findSchemaNodeByPath(
      sliceSchema,
      entry.name,
      entry.parentName,
    )
    if (node) return node.type
  }

  if (!entry.sliceId) {
    const node = findSchemaNodeByPath(
      content.template.field_schema,
      entry.name,
      entry.parentName,
    )
    if (node) return node.type
  }

  return 'plain_text'
}

/**
 * Returns true when a manifest entry can be synced without ambiguous parent context.
 */
export function canSyncManifestEntry(
  entry: RawFieldManifestEntry,
  content: PageContent,
): boolean {
  if (entry.declaredType && entry.declaredType !== 'array') {
    return true
  }

  if (entry.parentName) {
    return true
  }

  if (!entry.sliceId) {
    return (
      findSchemaNodeByPath(content.template.field_schema, entry.name, null) !==
      null
    )
  }

  if (!entry.sliceTypeKey) return false

  const sliceSchema =
    getSliceDefinition(entry.sliceTypeKey)?.fieldSchema ?? []
  const node = findSchemaNodeByPath(sliceSchema, entry.name, null)
  return node !== null && node.type !== 'array'
}
