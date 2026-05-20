<script lang="ts">
import type { FieldRow } from '~/types/cms'
import { usePageContent } from '~/composables/usePageContent'
import { usePageList } from '~/composables/usePageList'
import { resolveTemplateComponent } from '~/composables/useTemplate'
import { normalizeSlug } from '~/utils/slug'
</script>

<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useAuth()
const { setPageContent } = useCmsPanel()

const slug = computed(() => normalizeSlug(route.path))

// for the page content
const {
  data: content,
  status,
  refresh,
} = await useAsyncData(
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

// for nav
const { data: pageList } = await useAsyncData('page-list', () => usePageList())

const templateComponent = computed(() => {
  if (!content.value) return null
  return resolveTemplateComponent(content.value.template.key)
})

/**
 * Patches a field in local state after save from the editor modal.
 */
function onFieldUpdated(updated: FieldRow) {
  if (!content.value) return
  const index = content.value.fields.findIndex((f) => f.id === updated.id)
  if (index >= 0) {
    content.value.fields[index] = updated
  }
  content.value.fieldsById[updated.id] = updated
  if (updated.parent_id === null) {
    content.value.fieldsByName[updated.name] = updated
  }
}

watch(loggedIn, () => {
  refresh()
})

/**
 * Sync sidebar only when content matches the current route slug.
 * - Stale `content` from the previous page is ignored (not pushed to the panel).
 * - While refetching, `content` may be undefined briefly; we keep the panel as-is
 *   (do not clear on unmount — Suspense can remount the page and would wipe the panel).
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
</script>

<template>
  <nav>
    <NuxtLink
      v-for="page in pageList"
      :key="page.slug"
      :to="page.slug"
      :class="{ 'router-link-active': route.path === page.slug }"
    >
      {{ page.title ?? page.slug }}
    </NuxtLink>
    <NuxtLink to="/login">Login</NuxtLink>
  </nav>

  <div v-if="status === 'pending'">Loading...</div>

  <div v-else-if="!content">
    <h1>404</h1>
    <p>Page not found.</p>
  </div>

  <PageEditorProvider
    v-else-if="templateComponent"
    :enabled="loggedIn"
    :fields="content.fields"
    :fields-by-id="content.fieldsById"
    :fields-by-name="content.fieldsByName"
    @field-updated="onFieldUpdated"
  >
    <component
      :is="templateComponent"
      :fields="content.fields"
    />
  </PageEditorProvider>

  <div v-else>
    <p>Unknown template.</p>
  </div>
</template>
