import type { FieldRow } from '~/types/cms'
import { usePageContent } from '~/composables/usePageContent'
import { usePageList } from '~/composables/usePageList'
import { resolveTemplateComponent } from '~/composables/useTemplate'
import { normalizeSlug } from '~/utils/slug'

/**
 * Loads the current CMS page (cached via useAsyncData), nav list, and sidebar sync.
 * Must stay synchronous (no `await`) so `watch` / `watchEffect` run inside setup.
 * Call from `[...slug].vue` setup only so prerender payload and edit patches stay correct.
 */
export function useGhostPage() {
  const route = useRoute()
  const { loggedIn } = useAuth()
  const { setPageContent } = useCmsPanel()

  const slug = computed(() => normalizeSlug(route.path))

  const {
    data: content,
    status,
    refresh,
  } = useAsyncData(
    () => `page:${slug.value}`,
    () => usePageContent(slug.value),
    {
      watch: [slug],
      getCachedData(key, nuxtApp) {
        if (loggedIn.value) {
          return undefined
        }
        return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
      },
    },
  )

  const { data: pageList } = useAsyncData('page-list', () => usePageList())

  const templateComponent = computed(() => {
    if (!content.value) return null
    return resolveTemplateComponent(content.value.template.key)
  })

  /**
   * Patches a field in local state after save from the editor modal.
   * Replaces the page content object — useAsyncData data is a shallowRef, so
   * in-place mutations to fields / maps do not trigger template updates.
   */
  function patchField(updated: FieldRow) {
    const current = content.value
    if (!current) return

    const index = current.fields.findIndex((f) => f.id === updated.id)
    const fields =
      index >= 0
        ? current.fields.map((f, i) => (i === index ? updated : f))
        : [...current.fields, updated]

    content.value = {
      ...current,
      fields,
      fieldsById: { ...current.fieldsById, [updated.id]: updated },
      fieldsByName:
        updated.parent_id === null
          ? { ...current.fieldsByName, [updated.name]: updated }
          : current.fieldsByName,
    }
  }

  watch(loggedIn, () => {
    refresh()
  })

  /**
   * Sync sidebar only when content matches the current route slug.
   * Stale content from the previous page is ignored. While refetching, content may
   * be undefined briefly; the panel is left as-is (do not clear on unmount).
   */
  watchEffect(() => {
    const data = content.value
    const currentSlug = slug.value
    if (data?.page.slug === currentSlug) {
      setPageContent(data)
    } else if (data) {
      setPageContent(null)
    }
  })

  return {
    route,
    slug,
    content,
    status,
    refresh,
    pageList,
    templateComponent,
    patchField,
    loggedIn,
  }
}
