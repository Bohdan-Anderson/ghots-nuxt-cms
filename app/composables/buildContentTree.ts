import type { FieldRow, PageSliceRow } from '~/types/cms'
import { getSliceDefinition } from '~/slices/registry'

export interface FieldTreeNode {
  field: FieldRow
  depth: number
}

export interface SliceTreeGroup {
  slice: PageSliceRow
  label: string
  fields: FieldTreeNode[]
}

/**
 * Flattens fields into display order with depth for indentation.
 */
export function buildFieldTree(fields: FieldRow[]): FieldTreeNode[] {
  const byParent = new Map<string | null, FieldRow[]>()
  for (const field of fields) {
    const key = field.parent_id
    const group = byParent.get(key) ?? []
    group.push(field)
    byParent.set(key, group)
  }

  const result: FieldTreeNode[] = []

  function walk(parentId: string | null, depth: number) {
    const siblings = byParent.get(parentId) ?? []
    for (const field of siblings) {
      result.push({ field, depth })
      if (field.type === 'section' || field.type === 'array') {
        walk(field.id, depth + 1)
      }
    }
  }

  walk(null, 0)
  return result
}

/**
 * Builds sidebar groups: page-level field tree, then each slice with its fields.
 */
export function buildContentTree(
  pageFields: FieldRow[],
  slices: PageSliceRow[],
  fieldsBySliceId: Record<string, FieldRow[]>,
): { pageFieldNodes: FieldTreeNode[]; sliceGroups: SliceTreeGroup[] } {
  const pageFieldNodes = buildFieldTree(pageFields)

  const sliceGroups: SliceTreeGroup[] = slices.map((slice, index) => {
    const definition = getSliceDefinition(slice.slice_type_key)
    const label = definition?.label ?? slice.slice_type_key
    const fields = buildFieldTree(fieldsBySliceId[slice.id] ?? [])
    return {
      slice,
      label: `${label} #${index + 1}`,
      fields,
    }
  })

  return { pageFieldNodes, sliceGroups }
}
