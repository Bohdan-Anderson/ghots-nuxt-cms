<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { fieldTypeSupportsOnPageClick } from '~/fields/registry'
import { rebuildPageContent } from '~/fields/pageContent'
import { syncFieldsFromDom } from '~/fields/syncFieldsFromDom'
import {
  ensureField,
  ensureInputFromElement,
} from '~/fields/ensureField'
import {
  resolveFieldParentContext,
} from '~/fields/domContext'

/**
 * Wraps a page template for inline CMS editing.
 * Registers field lookups, delegates clicks on [data-name] to the modal,
 * syncs missing fields from DOM markup, and builds the sidebar content tree.
 */
const props = defineProps<{
  /** When true, click delegation and FieldEditModal are active (typically loggedIn). */
  enabled: boolean
  fieldsById: Record<string, FieldRow>
  fieldsByParentAndName: Record<string, FieldRow>
}>()

const emit = defineEmits<{
  fieldUpdated: [field: FieldRow]
}>()

const rootRef = ref<HTMLElement | null>(null)
const editor = usePageEditor()
const { pageContent, applyPageContent } = useCmsPanel()
const { rebuildFromDom, clearTree } = useContentTree()
const syncing = ref(false)

function syncRegistry() {
  editor.registerFields(props.fieldsById, props.fieldsByParentAndName)
}

function refreshContentTree(
  fieldsById: Record<string, FieldRow> = props.fieldsById,
) {
  if (!props.enabled || !rootRef.value) return
  rebuildFromDom(rootRef.value, fieldsById)
}

function applySyncedFields(changed: FieldRow[]) {
  const current = pageContent.value
  if (!current || changed.length === 0) return

  const byId = new Map(current.fields.map((row) => [row.id, row]))
  for (const row of changed) {
    byId.set(row.id, row)
  }

  const rebuilt = rebuildPageContent(current, {
    fields: Array.from(byId.values()).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  })

  applyPageContent(rebuilt)
  syncRegistry()
  refreshContentTree(rebuilt.fieldsById)
}

async function runFieldSync() {
  if (!props.enabled || !rootRef.value || !pageContent.value || syncing.value) {
    return
  }

  syncing.value = true
  try {
    const supabase = useSupabase()
    const changed = await syncFieldsFromDom(
      supabase,
      pageContent.value,
      rootRef.value,
    )
    applySyncedFields(changed)
  } finally {
    syncing.value = false
    await nextTick()
    refreshContentTree(pageContent.value?.fieldsById ?? props.fieldsById)
  }
}

async function ensureFieldForElement(el: HTMLElement): Promise<FieldRow | null> {
  const current = pageContent.value
  if (!current) return null

  const context = resolveFieldParentContext(el)
  const input = ensureInputFromElement(el, context)
  if (!input) return null

  syncing.value = true
  try {
    const supabase = useSupabase()
    const result = await ensureField(
      supabase,
      current,
      input,
      current.fields,
    )
    if (result) {
      applySyncedFields([result])
    }
    return result
  } finally {
    syncing.value = false
  }
}

watch(
  () => [props.fieldsById, props.fieldsByParentAndName] as const,
  syncRegistry,
  { deep: true },
)

watch(
  () => props.enabled,
  async (enabled) => {
    if (!enabled) {
      clearTree()
      return
    }
    await nextTick()
    await runFieldSync()
  },
  { flush: 'post' },
)

watch(
  () => props.fieldsById,
  async () => {
    if (!props.enabled || !rootRef.value) return
    await nextTick()
    refreshContentTree()
  },
  { deep: true },
)

const { registerFieldSync } = useCmsFieldSync()

async function onClick(event: MouseEvent) {
  if (!props.enabled) return

  const target = event.target as HTMLElement
  const el = target.closest('[data-name]') as HTMLElement | null
  if (!el) return

  const column = editor.editableColumnFromElement(el)
  if (!column || !fieldTypeSupportsOnPageClick(column)) return

  let field = editor.resolveFieldFromElement(el)

  if (!field) {
    field = (await ensureFieldForElement(el)) ?? null
  }

  if (!field) return

  event.preventDefault()
  editor.open(field, column)
}

let removeFieldUpdatedListener: (() => void) | null = null

onMounted(() => {
  syncRegistry()
  registerFieldSync(runFieldSync)
  removeFieldUpdatedListener = editor.addFieldUpdatedHandler((updated) => {
    if (updated.global_id) return
    emit('fieldUpdated', updated)
  })
  rootRef.value?.addEventListener('click', onClick)
  void nextTick(() => runFieldSync())
})

onUnmounted(() => {
  removeFieldUpdatedListener?.()
  removeFieldUpdatedListener = null
  registerFieldSync(null)
  rootRef.value?.removeEventListener('click', onClick)
  clearTree()
})
</script>

<template>
  <div
    ref="rootRef"
    :class="{ 'page--editing': enabled }"
  >
    <slot />
  </div>
  <FieldEditModal v-if="enabled" />
</template>

<style scoped>
.page--editing :deep([data-name]) {
  cursor: pointer;
}
</style>
