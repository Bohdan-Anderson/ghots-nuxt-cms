import type { FieldRow, PageContent } from '~/types/cms'
import { patchFieldInContent } from '~/fields/pageContent'

export type CmsPanelTab = 'contents' | 'pages' | 'meta' | 'publish'

/**
 * Shared state for the logged-in CMS left panel (open/tab/current page).
 * `pageContent` is the single source of truth for in-session editor state.
 */
export function useCmsPanel() {
  const isOpen = useState<boolean>('cms-panel-open', () => false)
  const activeTab = useState<CmsPanelTab>('cms-panel-tab', () => 'contents')
  const pageContent = useState<PageContent | null>(
    'cms-panel-page-content',
    () => null,
  )

  function toggle() {
    isOpen.value = !isOpen.value
  }

  /**
   * Replaces the current page payload in the panel (load, reload, meta save, logout clear).
   */
  function applyPageContent(content: PageContent | null) {
    pageContent.value = content
  }

  /** @deprecated Use `applyPageContent` */
  const setPageContent = applyPageContent

  /**
   * Patches a field after a modal save so sidebar and on-page preview stay in sync.
   */
  function patchField(updated: FieldRow) {
    const current = pageContent.value
    if (!current) return
    pageContent.value = patchFieldInContent(current, updated)
  }

  return {
    isOpen,
    activeTab,
    pageContent,
    toggle,
    applyPageContent,
    setPageContent,
    patchField,
  }
}

export { patchFieldInContent } from '~/fields/pageContent'
