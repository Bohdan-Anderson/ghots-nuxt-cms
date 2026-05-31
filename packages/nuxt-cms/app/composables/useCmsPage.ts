import { usePageContent } from '~/composables/usePageContent'
import { usePageListData } from '~/composables/usePageList'
import { resolveTemplateComponent } from '#cms/registries'
import { normalizeSlug } from '~/utils/slug'

/**
 * Loads the current CMS page (cached via useAsyncData), nav list, and sidebar sync.
 * Must stay synchronous (no `await`) so `watch` / `watchEffect` run inside setup.
 * Call from `[...slug].vue` setup only so prerender payload and edit patches stay correct.
 *
 * Guest: `useAsyncData` + prerender payload only.
 * Editor: `useCmsPanel().pageContent` only (populated from Supabase fetch, not from merge).
 */
export function useCmsPage() {
  const route = useRoute()
  const { loggedIn } = useAuth()
  const { pageContent, applyPageContent, patchField } = useCmsPanel()

  const slug = computed(() => normalizeSlug(route.path))

  const {
    data: cachedContent,
    status: fetchStatus,
    refresh,
  } = useGuestCachedAsyncData(
    () => `page:${slug.value}`,
    () => usePageContent(slug.value, { loggedIn: loggedIn.value }),
    { watch: [slug] },
  )

  const { data: pageList, refresh: refreshPageList } = usePageListData()

  /**
   * Guest: prerender/async cache. Editor: panel store for the current slug only.
   */
  const content = computed(() => {
    if (loggedIn.value) {
      const panel = pageContent.value
      return panel?.page.slug === slug.value ? panel : null
    }
    return cachedContent.value ?? null
  })

  const status = computed(() => {
    if (loggedIn.value && content.value) {
      return 'success'
    }
    return fetchStatus.value
  })

  const templateComponent = computed(() => {
    if (!content.value) return null
    return resolveTemplateComponent(content.value.template.key)
  })

  watch(loggedIn, () => {
    refresh()
    refreshPageList()
  })

  /**
   * When logged in, copy async fetch results into the panel (editor source of truth).
   * Guests never read the panel for page body — only the prerender cache above.
   */
  watchEffect(() => {
    if (!loggedIn.value) return

    const data = cachedContent.value
    const currentSlug = slug.value
    if (data?.page.slug === currentSlug) {
      applyPageContent(data)
    } else if (data) {
      applyPageContent(null)
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

/** @deprecated Use `useCmsPage` — kept for reference-app migration. */
export const useGhostPage = useCmsPage
