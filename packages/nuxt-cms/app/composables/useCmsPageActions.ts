import { insertArrayItem, deleteArrayItem } from '~/composables/useArrayFields'
import { deletePage } from '~/composables/usePageCreate'
import { updatePageMeta, type PageMetaInput } from '~/composables/usePageMeta'
import { collectFieldSubtreeIds } from '~/fields/maps'
import { rebuildPageContent } from '~/fields/pageContent'
import { useCmsPanel } from '~/composables/useCmsPanel'

/**
 * Page meta and array mutations for the CMS sidebar.
 */
export function useCmsPageActions() {
  const { pageContent, applyPageContent } = useCmsPanel()

  /**
   * Saves page meta and updates the panel store page row.
   */
  async function saveMeta(meta: PageMetaInput): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const updatedPage = await updatePageMeta(current.page.id, meta)
    applyPageContent(
      rebuildPageContent(current, {
        page: {
          ...current.page,
          title: updatedPage.title,
          meta_title: updatedPage.meta_title,
          meta_description: updatedPage.meta_description,
          og_image: updatedPage.og_image,
          noindex: updatedPage.noindex,
        },
      }),
    )
  }

  /**
   * Adds an array item and patches the panel store in place.
   */
  async function addArrayItem(arrayFieldId: string): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const newFields = await insertArrayItem(current, arrayFieldId)
    applyPageContent(
      rebuildPageContent(current, {
        fields: [...current.fields, ...newFields],
      }),
    )

    const { requestFieldSync } = useCmsFieldSync()
    await nextTick()
    await requestFieldSync()
  }

  /**
   * Deletes the current page and clears the panel store.
   */
  async function deleteCurrentPage(): Promise<void> {
    const current = pageContent.value
    if (!current) return

    await deletePage(current.page.id)
    applyPageContent(null)
  }

  /**
   * Removes an array item section and patches the panel store in place.
   */
  async function removeArrayItem(itemSectionId: string): Promise<void> {
    const current = pageContent.value
    await deleteArrayItem(itemSectionId)
    if (!current) return

    const removeIds = collectFieldSubtreeIds(current.fields, itemSectionId)
    applyPageContent(
      rebuildPageContent(current, {
        fields: current.fields.filter((field) => !removeIds.has(field.id)),
      }),
    )
  }

  return {
    saveMeta,
    deleteCurrentPage,
    addArrayItem,
    removeArrayItem,
  }
}
