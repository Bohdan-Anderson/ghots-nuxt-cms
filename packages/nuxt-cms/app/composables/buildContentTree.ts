import type { ContentTreeNode } from '~/types/cms'

/**
 * Flattens a nested content tree for sidebar list rendering with depth preserved.
 */
export function flattenTreeForSidebar(
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
