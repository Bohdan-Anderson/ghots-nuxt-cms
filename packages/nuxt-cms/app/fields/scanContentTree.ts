import type { ContentTreeNode, FieldKind } from '~/types/cms'
import {
  domTypeToKind,
  isEditableDomType,
  isStructuralDomType,
  parseDomType,
  resolveFieldBinding,
  type FieldRegistry,
} from '~/fields/domContext'
import { firstPopulatedColumn } from '~/fields/fieldValues'

/**
 * Computes sidebar indent depth from section/array ancestors.
 */
function computeDepth(element: HTMLElement): number {
  let depth = 0
  let current = element.parentElement

  while (current) {
    const domType = parseDomType(current.dataset.type)
    if (
      current.hasAttribute('data-name') &&
      (domType === 'section' || domType === 'array')
    ) {
      depth++
    }
    if (domType === 'page') break
    current = current.parentElement
  }

  return depth
}

/**
 * Creates a tree node from a DOM element.
 */
function nodeFromElement(
  element: HTMLElement,
  depth: number,
  registry?: FieldRegistry,
): ContentTreeNode {
  const domType = parseDomType(element.dataset.type)
  const name = element.dataset.name?.trim() ?? 'page'
  const kind = domTypeToKind(domType)

  let previewColumn = null
  if (isEditableDomType(domType)) {
    previewColumn = domType
  }

  const binding = registry ? resolveFieldBinding(element, registry) : null

  return {
    id: element.dataset.id?.trim() || null,
    name,
    domType,
    kind: kind as FieldKind | null,
    depth,
    parentFieldId: binding?.parentId ?? null,
    children: [],
    previewColumn,
  }
}

/**
 * Scans rendered page DOM and builds a nested content tree for the sidebar.
 */
export function scanContentTree(
  root: HTMLElement,
  registry?: FieldRegistry,
): ContentTreeNode[] {
  const elements = root.querySelectorAll('[data-name], [data-type="page"]')
  const flat: ContentTreeNode[] = []

  for (const node of elements) {
    const element = node as HTMLElement
    if (!element.dataset.name && element.dataset.type !== 'page') continue
    flat.push(nodeFromElement(element, computeDepth(element), registry))
  }

  return buildNestedTree(flat)
}

/**
 * Nests flat nodes by depth for hierarchical sidebar rendering.
 */
function buildNestedTree(flat: ContentTreeNode[]): ContentTreeNode[] {
  const roots: ContentTreeNode[] = []
  const stack: ContentTreeNode[] = []

  for (const node of flat) {
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= node.depth) {
      stack.pop()
    }

    const copy = { ...node, children: [] as ContentTreeNode[] }

    if (stack.length === 0) {
      roots.push(copy)
    } else {
      stack[stack.length - 1]!.children.push(copy)
    }

    const domType = node.domType
    if (
      domType !== 'page'
      && (isStructuralDomType(domType) || domType === 'array')
    ) {
      stack.push(copy)
    }
  }

  return roots
}

/**
 * Flattens a content tree for sidebar list rendering.
 */
export function flattenContentTree(
  nodes: ContentTreeNode[],
): ContentTreeNode[] {
  const result: ContentTreeNode[] = []

  function walk(node: ContentTreeNode) {
    result.push(node)
    for (const child of node.children) {
      walk(child)
    }
  }

  for (const node of nodes) {
    walk(node)
  }

  return result
}

/**
 * Enriches tree nodes with preview column from DB field rows when available.
 */
export function enrichTreeWithFields(
  nodes: ContentTreeNode[],
  fieldsById: Record<string, import('~/types/cms').FieldRow>,
): ContentTreeNode[] {
  function enrich(node: ContentTreeNode): ContentTreeNode {
    const field = node.id ? fieldsById[node.id] : undefined
    const previewColumn =
      node.previewColumn ?? (field ? firstPopulatedColumn(field) : null)

    return {
      ...node,
      previewColumn,
      children: node.children.map(enrich),
    }
  }

  return nodes.map(enrich)
}
