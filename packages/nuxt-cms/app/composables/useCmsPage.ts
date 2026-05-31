import { usePageContent } from '~/composables/usePageContent'
import { usePageListData } from '~/composables/usePageList'
import { resolveTemplateComponent } from '#cms/registries'
import { normalizeSlug } from '~/utils/slug'

/**
 * Loads the current CMS page (cached via useAsyncData), nav list, and sidebar sync.
 * Must stay synchronous (no `await`) so `watch` / `watchEffect` run inside setup.
 * Call from `[...slug].vue` setup only so prerender payload and edit patches stay correct.
 */
export function useCmsPage() {
  const route = useRoute()
  const { loggedIn } = useAuth()
  const { pageContent, setPageContent, patchField } = useCmsPanel()

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

  const { data: pageList, refresh: refreshPageList } = usePageListData()

  /**
   * Logged-in editors read from the panel store after fetch; guests use prerender cache.
   */
  const displayContent = computed(() => {
    const currentSlug = slug.value
    if (loggedIn.value) {
      const panel = pageContent.value
      if (panel?.page.slug === currentSlug) {
        return panel
      }
    }
    return content.value ?? null
  })

  const templateComponent = computed(() => {
    if (!displayContent.value) return null
    return resolveTemplateComponent(displayContent.value.template.key)
  })

  watch(loggedIn, () => {
    refresh()
    refreshPageList()
  })

  /**
   * Sync sidebar store only when content matches the current route slug.
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
    content: displayContent,
    status,
    refresh,
    pageList,
    templateComponent,
    patchField,
    loggedIn,
  }
}

/** @deprecated Use `useCmsPage` — kept for reference-app migration. */
export const useGhostPage = useCmsPage
