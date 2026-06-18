import type { FieldRow, NestedFieldNode } from './types.ts'

/**
 * Converts a flat field row to a nested API node (no parent_id / page_id).
 */
function toNestedNode(row: FieldRow): NestedFieldNode {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    plain_text: row.plain_text,
    richtext: row.richtext,
    link: row.link,
    image: row.image,
    sort_order: row.sort_order,
  }
}

/**
 * Builds a nested field tree from flat DB rows (parent_id links).
 */
export function nestFields(flat: FieldRow[]): NestedFieldNode[] {
  const byParent = new Map<string | null, FieldRow[]>()

  for (const field of flat) {
    const siblings = byParent.get(field.parent_id) ?? []
    siblings.push(field)
    byParent.set(field.parent_id, siblings)
  }

  function buildChildren(parentId: string | null): NestedFieldNode[] {
    const siblings = (byParent.get(parentId) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    )

    return siblings.map((row) => {
      const node = toNestedNode(row)
      const childRows = byParent.get(row.id)

      if (childRows && childRows.length > 0) {
        node.children = buildChildren(row.id)
      }

      return node
    })
  }

  return buildChildren(null)
}

/**
 * Flattens a nested field tree into DB rows with parent_id set from tree position.
 */
export function flattenFields(
  nodes: NestedFieldNode[],
  pageId: string,
  parentId: string | null = null,
): FieldRow[] {
  const flat: FieldRow[] = []

  for (const node of nodes) {
    const row: FieldRow = {
      id: node.id || crypto.randomUUID(),
      page_id: pageId,
      global_id: null,
      parent_id: parentId,
      name: node.name,
      kind: node.kind ?? null,
      plain_text: node.plain_text ?? null,
      richtext: node.richtext ?? null,
      link: node.link ?? null,
      image: node.image ?? null,
      sort_order: node.sort_order,
    }

    flat.push(row)

    if (node.children && node.children.length > 0) {
      flat.push(...flattenFields(node.children, pageId, row.id))
    }
  }

  return flat
}

/**
 * Validates nested field nodes before flattening.
 */
export function validateNestedFields(nodes: NestedFieldNode[]): string | null {
  function walk(node: NestedFieldNode, path: string): string | null {
    if (!node.name) {
      return `Field at ${path} is missing name`
    }

    if (typeof node.sort_order !== 'number') {
      return `Field "${node.name}" at ${path} is missing sort_order`
    }

    for (const child of node.children ?? []) {
      const childPath = `${path}/${child.name || '?'}`
      const error = walk(child, childPath)
      if (error) return error
    }

    return null
  }

  for (const node of nodes) {
    const error = walk(node, node.name)
    if (error) return error
  }

  return null
}
