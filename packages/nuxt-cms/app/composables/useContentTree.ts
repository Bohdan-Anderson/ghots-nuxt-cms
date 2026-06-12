import type { ContentTreeNode } from '~/types/cms'
import {
  enrichTreeWithFields,
  scanContentTree,
} from '~/fields/scanContentTree'

/**
 * Shared store for the DOM-scanned content tree (sidebar navigation).
 */
export function useContentTree() {
  const tree = useState<ContentTreeNode[]>('cms-content-tree', () => [])

  /**
   * Rebuilds the tree from rendered page DOM and enriches with DB field data.
   */
  function rebuildFromDom(
    root: HTMLElement,
    fieldsById: Record<string, import('~/types/cms').FieldRow>,
  ) {
    const scanned = scanContentTree(root)
    tree.value = enrichTreeWithFields(scanned, fieldsById)
  }

  function clearTree() {
    tree.value = []
  }

  return { tree, rebuildFromDom, clearTree }
}
