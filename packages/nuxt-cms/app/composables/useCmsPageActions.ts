import type { PageContent } from '~/types/cms'
import { usePageContent } from '~/composables/usePageContent'
import { normalizeSlug } from '~/utils/slug'
import {
  deletePageSlice,
  insertPageSlice,
  reorderPageSlices,
} from '~/composables/usePageSlices'
import { insertArrayItem, deleteArrayItem } from '~/composables/useArrayFields'
import { updatePageMeta, type PageMetaInput } from '~/composables/usePageMeta'

/**
 * Slice and meta mutations for the CMS sidebar, with panel store refresh.
 */
export function useCmsPageActions() {
  const { pageContent, applyPageContent } = useCmsPanel()
  const route = useRoute()

  /**
   * Refetches page content for the current route into the editor panel.
   */
  async function reloadCurrentPage(): Promise<PageContent | null> {
    const slug = normalizeSlug(route.path)
    const next = await usePageContent(slug)
    if (next?.page.slug === slug) {
      applyPageContent(next)
    }
    return next
  }

  /**
   * Adds a slice instance and refreshes panel state.
   */
  async function addSlice(sliceTypeKey: string): Promise<void> {
    const current = pageContent.value
    if (!current) return

    await insertPageSlice(current.page.id, sliceTypeKey)
    await reloadCurrentPage()
  }

  /**
   * Removes a slice instance and refreshes panel state.
   */
  async function removeSlice(sliceId: string): Promise<void> {
    await deletePageSlice(sliceId)
    await reloadCurrentPage()
  }

  /**
   * Moves a slice one position up or down in sort order.
   */
  async function moveSlice(sliceId: string, direction: -1 | 1): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const ids = current.slices.map((s) => s.id)
    const index = ids.indexOf(sliceId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return

    const next = [...ids]
    const [removed] = next.splice(index, 1)
    next.splice(target, 0, removed!)

    await reorderPageSlices(current.page.id, next)
    await reloadCurrentPage()
  }

  /**
   * Saves page meta and updates the panel store page row.
   */
  async function saveMeta(meta: PageMetaInput): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const updatedPage = await updatePageMeta(current.page.id, meta)
    applyPageContent({
      ...current,
      page: {
        ...current.page,
        title: updatedPage.title,
        meta_title: updatedPage.meta_title,
        meta_description: updatedPage.meta_description,
        og_image: updatedPage.og_image,
        noindex: updatedPage.noindex,
      },
    })
  }

  /**
   * Adds an array item and refreshes panel state.
   */
  async function addArrayItem(arrayFieldId: string): Promise<void> {
    await insertArrayItem(arrayFieldId)
    await reloadCurrentPage()
  }

  /**
   * Removes an array item section and refreshes panel state.
   */
  async function removeArrayItem(itemSectionId: string): Promise<void> {
    await deleteArrayItem(itemSectionId)
    await reloadCurrentPage()
  }

  return {
    reloadCurrentPage,
    addSlice,
    removeSlice,
    moveSlice,
    saveMeta,
    addArrayItem,
    removeArrayItem,
  }
}
