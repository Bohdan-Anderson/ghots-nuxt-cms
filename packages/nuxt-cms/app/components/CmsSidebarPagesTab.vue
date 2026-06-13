<script setup lang="ts">
import { createPage } from '~/composables/usePageCreate'
import { usePageListData } from '~/composables/usePageList'
import { useTemplatesData } from '~/composables/useTemplates'
import { slugify } from '~/utils/slug'

const route = useRoute()
const router = useRouter()
const { activeTab } = useCmsPanel()

const { data: pageList, refresh: refreshPageList } = usePageListData()
const { data: templates } = useTemplatesData()

const createBusy = ref(false)
const createError = ref<string | null>(null)
const newPageSlug = ref('')
const newPageTitle = ref('')
const newPageTemplateId = ref('')

watch(
  templates,
  (list) => {
    if (list?.length && !newPageTemplateId.value) {
      newPageTemplateId.value = list[0]!.id
    }
  },
  { immediate: true },
)

watch(newPageSlug, (value) => {
  const slugified = slugify(value)
  if (slugified !== value) {
    newPageSlug.value = slugified
  }
})

/**
 * Creates a new page and navigates to it.
 */
async function onCreatePage() {
  createError.value = null
  if (!newPageTemplateId.value) {
    createError.value = 'Choose a template.'
    return
  }
  if (createBusy.value) return
  createBusy.value = true
  try {
    const page = await createPage({
      slug: newPageSlug.value,
      title: newPageTitle.value,
      templateId: newPageTemplateId.value,
    })
    await refreshPageList()
    newPageSlug.value = ''
    newPageTitle.value = ''
    await router.push(page.slug)
    activeTab.value = 'contents'
  } catch (err) {
    createError.value =
      err instanceof Error ? err.message : 'Could not create page.'
  } finally {
    createBusy.value = false
  }
}
</script>

<template>
  <div class="cms-sidebar-body">
    <ul class="cms-sidebar-pages">
      <li
        v-for="page in pageList"
        :key="page.slug"
      >
        <NuxtLink
          :to="page.slug"
          :class="{ 'router-link-active': route.path === page.slug }"
        >
          {{ page.title ?? page.slug }}
        </NuxtLink>
      </li>
    </ul>

    <form
      class="cms-sidebar-form"
      @submit.prevent="onCreatePage"
    >
      <p class="cms-sidebar-hint">New page</p>
      <label>
        Slug
        <input
          v-model="newPageSlug"
          type="text"
          placeholder="/about"
          required
        />
      </label>
      <label>
        Title
        <input
          v-model="newPageTitle"
          type="text"
          placeholder="About us"
        />
      </label>
      <label>
        Template
        <select
          v-model="newPageTemplateId"
          required
        >
          <option
            v-for="tpl in templates"
            :key="tpl.id"
            :value="tpl.id"
          >
            {{ tpl.label }}
          </option>
        </select>
      </label>
      <p
        v-if="createError"
        class="cms-sidebar-form-error"
      >
        {{ createError }}
      </p>
      <button
        type="submit"
        :disabled="createBusy"
      >
        Create page
      </button>
    </form>
  </div>
</template>
