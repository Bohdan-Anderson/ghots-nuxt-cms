<script setup lang="ts">
const router = useRouter()
const { pageContent } = useCmsPanel()
const { saveMeta, deleteCurrentPage } = useCmsPageActions()
const { refresh: refreshPageList } = usePageListData()

const metaBusy = ref(false)
const deleteBusy = ref(false)
const deleteError = ref<string | null>(null)

const metaDraft = reactive({
  title: '',
  meta_title: '',
  meta_description: '',
  og_image: '',
  noindex: false,
})

const canDelete = computed(
  () => pageContent.value != null && pageContent.value.page.slug !== '/',
)

watch(
  () => pageContent.value?.page,
  (page) => {
    if (!page) return
    metaDraft.title = page.title ?? ''
    metaDraft.meta_title = page.meta_title ?? ''
    metaDraft.meta_description = page.meta_description ?? ''
    metaDraft.og_image = page.og_image ?? ''
    metaDraft.noindex = page.noindex ?? false
  },
  { immediate: true },
)

/**
 * Saves meta draft to Supabase and updates the panel store.
 */
async function onSaveMeta() {
  if (metaBusy.value) return
  metaBusy.value = true
  try {
    await saveMeta({
      title: metaDraft.title.trim() || null,
      meta_title: metaDraft.meta_title.trim() || null,
      meta_description: metaDraft.meta_description.trim() || null,
      og_image: metaDraft.og_image.trim() || null,
      noindex: metaDraft.noindex,
    })
  } finally {
    metaBusy.value = false
  }
}

/**
 * Deletes the current page after confirmation and navigates home.
 */
async function onDeletePage() {
  deleteError.value = null
  if (!pageContent.value || !canDelete.value) return
  if (deleteBusy.value) return
  if (!import.meta.client) return

  const label = pageContent.value.page.title ?? pageContent.value.page.slug
  if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return

  deleteBusy.value = true
  try {
    await deleteCurrentPage()
    await refreshPageList()
    await router.push('/')
  } catch (err) {
    deleteError.value =
      err instanceof Error ? err.message : 'Could not delete page.'
  } finally {
    deleteBusy.value = false
  }
}
</script>

<template>
  <div class="cms-sidebar-body">
    <p v-if="!pageContent" class="cms-sidebar-hint">
      Open a page to edit meta.
    </p>
    <template v-else>
      <form class="cms-sidebar-form" @submit.prevent="onSaveMeta">
        <p class="cms-sidebar-hint">
          Slug: <code>{{ pageContent.page.slug }}</code>
        </p>
        <label>
          Page title
          <input v-model="metaDraft.title" type="text" />
        </label>
        <label>
          Meta title
          <input v-model="metaDraft.meta_title" type="text" />
        </label>
        <label>
          Meta description
          <textarea v-model="metaDraft.meta_description" rows="3" />
        </label>
        <label>
          OG image URL
          <input v-model="metaDraft.og_image" type="url" />
        </label>
        <label>
          <input v-model="metaDraft.noindex" type="checkbox" />
          Noindex
        </label>
        <button type="submit" :disabled="metaBusy">
          Save meta
        </button>
      </form>

      <div class="cms-sidebar-danger">
        <p class="cms-sidebar-hint">Danger zone</p>
        <button
          type="button"
          class="cms-sidebar-danger-btn"
          :disabled="!canDelete || deleteBusy"
          @click="onDeletePage"
        >
          Delete page
        </button>
        <p v-if="pageContent.page.slug === '/'" class="cms-sidebar-hint">
          The home page cannot be deleted.
        </p>
        <p v-if="deleteError" class="cms-sidebar-form-error">
          {{ deleteError }}
        </p>
      </div>
    </template>
  </div>
</template>
