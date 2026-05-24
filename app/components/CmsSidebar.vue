<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { usePageListData } from '~/composables/usePageList'

const route = useRoute()
const { isOpen, activeTab, pageContent, toggle } = useCmsPanel()
const editor = usePageEditor()

const { data: pageList } = usePageListData()

interface FieldTreeNode {
  field: FieldRow
  depth: number
}

/**
 * Flattens fields into display order with depth for indentation.
 */
function buildFieldTree(fields: FieldRow[]): FieldTreeNode[] {
  const byParent = new Map<string | null, FieldRow[]>()
  for (const field of fields) {
    const key = field.parent_id
    const group = byParent.get(key) ?? []
    group.push(field)
    byParent.set(key, group)
  }

  const result: FieldTreeNode[] = []

  function walk(parentId: string | null, depth: number) {
    const siblings = byParent.get(parentId) ?? []
    for (const field of siblings) {
      result.push({ field, depth })
      if (field.type === 'section') {
        walk(field.id, depth + 1)
      }
    }
  }

  walk(null, 0)
  return result
}

const fieldTree = computed(() => {
  if (!pageContent.value) return []
  return buildFieldTree(pageContent.value.fields)
})

/**
 * Opens the edit modal for a plain_text field.
 */
function onFieldClick(field: FieldRow) {
  if (field.type !== 'plain_text') return
  editor.open(field)
}

/**
 * Truncates a field value for the sidebar preview.
 */
function previewValue(value: string | null): string {
  if (!value) return '(empty)'
  return value.length > 40 ? `${value.slice(0, 40)}…` : value
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
    <div class="cms-sidebar-tabs">
      <button
        type="button"
        :aria-pressed="activeTab === 'contents'"
        @click="activeTab = 'contents'"
      >
        Page contents
      </button>
      <button
        type="button"
        :aria-pressed="activeTab === 'pages'"
        @click="activeTab = 'pages'"
      >
        Pages
      </button>
    </div>

    <div v-show="activeTab === 'contents'" class="cms-sidebar-body">
      <p v-if="!pageContent">Open a page to see fields.</p>
      <ul v-else class="cms-sidebar-fields">
        <li
          v-for="{ field, depth } in fieldTree"
          :key="field.id"
          class="cms-sidebar-field"
          :style="{ paddingLeft: `${depth}rem` }"
        >
          <span v-if="field.type === 'section'">{{ field.name }}</span>
          <button
            v-else
            type="button"
            @click="onFieldClick(field)"
          >
            {{ field.name }}: {{ previewValue(field.value) }}
          </button>
        </li>
      </ul>
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
    </div>
  </aside>
</template>

<style scoped>
.cms-sidebar-toggle {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 101;
  padding: 0.25rem 0.5rem;
}

.cms-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 16rem;
  z-index: 100;
  background: #fff;
  border-right: 1px solid #ccc;
  transform: translateX(-100%);
  overflow: auto;
  padding: 2rem 0.5rem 0.5rem;
}

.cms-sidebar--open {
  transform: translateX(0);
}

.cms-sidebar-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.cms-sidebar-fields,
.cms-sidebar-pages {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cms-sidebar-field button {
  text-align: left;
  width: 100%;
}
</style>
