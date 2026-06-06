import {
  deletePageSlice,
  insertPageSlice,
  reorderPageSlices,
} from '~/composables/usePageSlices'
import { insertArrayItem, deleteArrayItem } from '~/composables/useArrayFields'
import { deletePage } from '~/composables/usePageCreate'
import { updatePageMeta, type PageMetaInput } from '~/composables/usePageMeta'
import { collectFieldSubtreeIds } from '~/fields/maps'
import { rebuildPageContent } from '~/fields/pageContent'
import { useCmsPanel } from '~/composables/useCmsPanel'

/**
 * Slice and meta mutations for the CMS sidebar, with panel store refresh.
 */
export function useCmsPageActions() {
  const { pageContent, applyPageContent } = useCmsPanel()

  /**
   * Adds a slice instance and patches the panel store in place.
   */
  async function addSlice(sliceTypeKey: string): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const { slice, fields } = await insertPageSlice(current.page.id, sliceTypeKey)
    const slices = [...current.slices, slice].sort(
      (a, b) => a.sort_order - b.sort_order,
    )

    applyPageContent(
      rebuildPageContent(current, {
        slices,
        fields: [...current.fields, ...fields],
      }),
    )
  }

  /**
   * Removes a slice instance and patches the panel store in place.
   */
  async function removeSlice(sliceId: string): Promise<void> {
    const current = pageContent.value
    await deletePageSlice(sliceId)
    if (!current) return

    applyPageContent(
      rebuildPageContent(current, {
        slices: current.slices.filter((slice) => slice.id !== sliceId),
        fields: current.fields.filter((field) => field.slice_id !== sliceId),
      }),
    )
  }

  /**
   * Moves a slice one position up or down in sort order.
   */
  async function moveSlice(sliceId: string, direction: -1 | 1): Promise<void> {
    const current = pageContent.value
    if (!current) return

    const ids = current.slices.map((slice) => slice.id)
    const index = ids.indexOf(sliceId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return

    const nextIds = [...ids]
    const [removed] = nextIds.splice(index, 1)
    nextIds.splice(target, 0, removed!)

    await reorderPageSlices(current.page.id, nextIds)

    const slices = nextIds.map((id, sortOrder) => {
      const slice = current.slices.find((row) => row.id === id)!
      return { ...slice, sort_order: sortOrder }
    })

    applyPageContent(rebuildPageContent(current, { slices }))
  }

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
    addSlice,
    removeSlice,
    moveSlice,
    saveMeta,
    deleteCurrentPage,
    addArrayItem,
    removeArrayItem,
  }
}
