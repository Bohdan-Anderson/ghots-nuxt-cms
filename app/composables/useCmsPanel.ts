import type { PageContent } from '~/types/cms'

export type CmsPanelTab = 'contents' | 'pages'

/**
 * Shared state for the logged-in CMS left panel (open/tab/current page).
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

  function setPageContent(content: PageContent | null) {
    pageContent.value = content
  }

  return {
    isOpen,
    activeTab,
    pageContent,
    toggle,
    setPageContent,
  }
}
