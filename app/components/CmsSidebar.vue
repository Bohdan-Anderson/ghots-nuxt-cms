<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { buildContentTree } from '~/composables/buildContentTree'
import { usePageListData } from '~/composables/usePageList'
import { useTemplatesData } from '~/composables/useTemplates'
import { createPage } from '~/composables/usePageCreate'
import { listSliceDefinitions } from '~/slices/registry'
import { isEditableFieldType, previewFieldValue } from '~/fields/registry'

const route = useRoute()
const router = useRouter()
const { isOpen, activeTab, pageContent, toggle } = useCmsPanel()
const editor = usePageEditor()
const { addSlice, removeSlice, moveSlice, saveMeta } = useCmsPageActions()

const { data: pageList, refresh: refreshPageList } = usePageListData()
const { data: templates } = useTemplatesData()

const sliceTypes = listSliceDefinitions()
const selectedSliceType = ref(sliceTypes[0]?.key ?? '')
const sliceBusy = ref(false)
const metaBusy = ref(false)
const createBusy = ref(false)
const createError = ref<string | null>(null)

const newPageSlug = ref('')
const newPageTitle = ref('')
const newPageTemplateId = ref('')

const metaDraft = reactive({
  title: '',
  meta_title: '',
  meta_description: '',
  og_image: '',
  noindex: false,
})

const contentTree = computed(() => {
  if (!pageContent.value) {
    return { pageFieldNodes: [], sliceGroups: [] }
  }
  return buildContentTree(
    pageContent.value.pageFields,
    pageContent.value.slices,
    pageContent.value.fieldsBySliceId,
  )
})

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

watch(
  templates,
  (list) => {
    if (list?.length && !newPageTemplateId.value) {
      newPageTemplateId.value = list[0]!.id
    }
  },
  { immediate: true },
)

/**
 * Opens the edit modal for an editable field and scrolls to it on the page.
 */
function onFieldClick(field: FieldRow) {
  editor.focusOnPage(field)
  if (!isEditableFieldType(field.type)) return
  editor.open(field)
}

/**
 * Scrolls to a slice block on the page canvas.
 */
function onSliceClick(sliceId: string) {
  editor.focusSliceOnPage(sliceId)
}

/**
 * Sidebar preview for a field value (type-aware).
 */
function previewValue(field: FieldRow): string {
  return previewFieldValue(field.type, field.value)
}

/**
 * Inserts a new slice on the current page.
 */
async function onAddSlice() {
  if (!selectedSliceType.value || sliceBusy.value) return
  sliceBusy.value = true
  try {
    await addSlice(selectedSliceType.value)
  } finally {
    sliceBusy.value = false
  }
}

/**
 * Removes a slice after confirmation.
 */
async function onRemoveSlice(sliceId: string, label: string) {
  if (sliceBusy.value) return
  if (!import.meta.client) return
  if (!window.confirm(`Remove ${label} from this page?`)) return
  sliceBusy.value = true
  try {
    await removeSlice(sliceId)
  } finally {
    sliceBusy.value = false
  }
}

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
  <button
    type="button"
    class="cms-sidebar-toggle"
    aria-label="Toggle CMS panel"
    @click="toggle"
  >
    CMS
  </button>

  <aside
    class="cms-sidebar"
    :class="{ 'cms-sidebar--open': isOpen }"
  >
    <CmsPublishPanel />

    <div class="cms-sidebar-tabs">
      <button
        type="button"
        :aria-pressed="activeTab === 'contents'"
        @click="activeTab = 'contents'"
      >
        Content
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'pages'"
        @click="activeTab = 'pages'"
      >
        Pages
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'meta'"
        @click="activeTab = 'meta'"
      >
        Meta
      </button>
    </div>

    <div v-show="activeTab === 'contents'" class="cms-sidebar-body">
      <p v-if="!pageContent" class="cms-sidebar-hint">
        Open a page to see fields and slices.
      </p>

      <template v-else>
        <p v-if="contentTree.pageFieldNodes.length" class="cms-sidebar-hint">
          Page fields
        </p>
        <ul v-if="contentTree.pageFieldNodes.length" class="cms-sidebar-fields">
          <li
            v-for="{ field, depth } in contentTree.pageFieldNodes"
            :key="field.id"
            class="cms-sidebar-field-row"
            :style="{ paddingLeft: `${depth * 0.75}rem` }"
          >
            <span
              v-if="field.type === 'section'"
              class="cms-sidebar-section-label"
            >
              {{ field.name }}
            </span>
            <button
              v-else
              type="button"
              class="cms-sidebar-field-btn"
              @click="onFieldClick(field)"
            >
              {{ field.name }}: {{ previewValue(field) }}
            </button>
          </li>
        </ul>

        <ul class="cms-sidebar-slices">
          <li
            v-for="{ slice, label, fields } in contentTree.sliceGroups"
            :key="slice.id"
            class="cms-sidebar-slice"
          >
            <div class="cms-sidebar-slice-header">
              <button
                type="button"
                class="cms-sidebar-slice-title"
                @click="onSliceClick(slice.id)"
              >
                {{ label }}
              </button>
              <div class="cms-sidebar-slice-actions">
                <button
                  type="button"
                  title="Move up"
                  :disabled="sliceBusy"
                  @click="moveSlice(slice.id, -1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  title="Move down"
                  :disabled="sliceBusy"
                  @click="moveSlice(slice.id, 1)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  title="Remove slice"
                  :disabled="sliceBusy"
                  @click="onRemoveSlice(slice.id, label)"
                >
                  ×
                </button>
              </div>
            </div>
            <ul class="cms-sidebar-fields">
              <li
                v-for="{ field, depth } in fields"
                :key="field.id"
                class="cms-sidebar-field-row"
                :style="{ paddingLeft: `${depth * 0.75}rem` }"
              >
                <span
                  v-if="field.type === 'section'"
                  class="cms-sidebar-section-label"
                >
                  {{ field.name }}
                </span>
                <button
                  v-else
                  type="button"
                  class="cms-sidebar-field-btn"
                  @click="onFieldClick(field)"
                >
                  {{ field.name }}: {{ previewValue(field) }}
                </button>
              </li>
            </ul>
          </li>
        </ul>

        <div v-if="sliceTypes.length" class="cms-sidebar-add-slice">
          <select v-model="selectedSliceType" :disabled="sliceBusy">
            <option
              v-for="def in sliceTypes"
              :key="def.key"
              :value="def.key"
            >
              {{ def.label }}
            </option>
          </select>
          <button type="button" :disabled="sliceBusy" @click="onAddSlice">
            Add slice
          </button>
        </div>
      </template>
    </div>

    <div v-show="activeTab === 'pages'" class="cms-sidebar-body">
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

      <form class="cms-sidebar-form" @submit.prevent="onCreatePage">
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
          <input v-model="newPageTitle" type="text" placeholder="About us" />
        </label>
        <label>
          Template
          <select v-model="newPageTemplateId" required>
            <option
              v-for="tpl in templates"
              :key="tpl.id"
              :value="tpl.id"
            >
              {{ tpl.label }}
            </option>
          </select>
        </label>
        <p v-if="createError" class="cms-sidebar-form-error">
          {{ createError }}
        </p>
        <button type="submit" :disabled="createBusy">
          Create page
        </button>
      </form>
    </div>

    <div v-show="activeTab === 'meta'" class="cms-sidebar-body">
      <p v-if="!pageContent" class="cms-sidebar-hint">
        Open a page to edit meta.
      </p>
      <form
        v-else
        class="cms-sidebar-form"
        @submit.prevent="onSaveMeta"
      >
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
    </div>
  </aside>
</template>
