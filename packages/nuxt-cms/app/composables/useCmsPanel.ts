import type { FieldRow, PageContent } from '~/types/cms'
import { buildFieldMaps, pageLevelFields } from '~/composables/seedFields'

export { rebuildPageContent } from '~/composables/seedFields'

export type CmsPanelTab = 'contents' | 'pages' | 'meta'

/**
 * Returns page content with one field replaced (immutable update for reactivity).
 */
export function patchFieldInContent(
  current: PageContent,
  updated: FieldRow,
): PageContent {
  const index = current.fields.findIndex((f) => f.id === updated.id)
  const fields =
    index >= 0
      ? current.fields.map((f, i) => (i === index ? updated : f))
      : [...current.fields, updated]

  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fields)

  return {
    ...current,
    fields,
    pageFields: pageLevelFields(fields),
    fieldsBySliceId,
    fieldsById,
    fieldsByName,
  }
}

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
