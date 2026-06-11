<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { fieldTypeSupportsOnPageClick } from '~/fields/registry'
import { collectFieldManifest, manifestEntryFromElement } from '~/fields/collectFieldManifest'
import { rebuildPageContent } from '~/fields/pageContent'
import { syncFieldsFromManifest } from '~/fields/syncFieldsFromManifest'
import { resolveManifestFieldType } from '~/fields/resolveManifestFieldType'
import { ensureField } from '~/fields/ensureField'

/**
 * Wraps a page template for inline CMS editing.
 * Registers field lookups with usePageEditor, delegates clicks on [data-name]
 * elements to open the modal, syncs missing fields from DOM markup when enabled,
 * and bubbles saves to the parent via fieldUpdated.
 */
const props = defineProps<{
  /** When true, click delegation and FieldEditModal are active (typically loggedIn). */
  enabled: boolean
  /** Full field list for the page (passed through for potential future use). */
  fields: FieldRow[]
  /** Lookup by field id — matches data-id on template elements. */
  fieldsById: Record<string, FieldRow>
  /** Lookup by field name — matches data-name on template elements. */
  fieldsByName: Record<string, FieldRow>
}>()

const emit = defineEmits<{
  /** Fired after a successful save so the parent can patch local page content. */
  fieldUpdated: [field: FieldRow]
}>()

/** Root element for a single delegated click listener (avoids per-field listeners). */
const rootRef = ref<HTMLElement | null>(null)

/** Shared editor state (modal, registry, save) — one instance per app. */
const editor = usePageEditor()
const { pageContent, applyPageContent } = useCmsPanel()

/** Prevents re-entrant sync while applying merged field rows. */
const syncing = ref(false)

/**
 * Keeps usePageEditor's registry in sync with the current page's field maps
 * so resolveFieldFromElement can map clicks to FieldRow instances.
 */
function syncRegistry() {
  editor.registerFields(props.fieldsById, props.fieldsByName)
}

/**
 * Merges changed field rows into the panel page content.
 */
function applySyncedFields(changed: FieldRow[]) {
  const current = pageContent.value
  if (!current || changed.length === 0) return

  const byId = new Map(current.fields.map((row) => [row.id, row]))
  for (const row of changed) {
    byId.set(row.id, row)
  }

  applyPageContent(
    rebuildPageContent(current, {
      fields: Array.from(byId.values()).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }),
  )
}

/**
 * Scans rendered markup and ensures missing DB field rows exist for editors.
 */
async function runFieldSync() {
  if (!props.enabled || !rootRef.value || !pageContent.value || syncing.value) {
    return
  }

  const manifest = collectFieldManifest(rootRef.value)
  if (manifest.length === 0) return

  syncing.value = true
  try {
    const supabase = useSupabase()
    const changed = await syncFieldsFromManifest(
      supabase,
      pageContent.value,
      manifest,
    )
    applySyncedFields(changed)
  } finally {
    syncing.value = false
  }
}

/**
 * Ensures a single field from a clicked element when no DB row exists yet.
 */
async function ensureFieldForElement(el: HTMLElement): Promise<FieldRow | null> {
  const current = pageContent.value
  if (!current) return null

  const entry = manifestEntryFromElement(el)
  if (!entry) return null

  const resolved = {
    ...entry,
    type: resolveManifestFieldType(entry, current),
  }

  syncing.value = true
  try {
    const supabase = useSupabase()
    const result = await ensureField(
      supabase,
      current,
      resolved,
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

// Re-register when field maps change (e.g. after patchField from parent).
watch(
  () => [props.fieldsById, props.fieldsByName] as const,
  syncRegistry,
  { deep: true },
)

watch(
  () => [props.enabled, props.fields.length] as const,
  async () => {
    if (!props.enabled) return
    await nextTick()
    await runFieldSync()
  },
  { flush: 'post' },
)

/**
 * Click delegation: finds the nearest [data-name] ancestor and opens the modal
 * for field types that support on-page editing (see field type registry).
 */
async function onClick(event: MouseEvent) {
  if (!props.enabled) return

  const target = event.target as HTMLElement
  const el = target.closest('[data-name]') as HTMLElement | null
  if (!el) return

  let field = editor.resolveFieldFromElement(el)

  if (!field) {
    field = (await ensureFieldForElement(el)) ?? null
  }

  if (!field || !fieldTypeSupportsOnPageClick(field.type)) return

  event.preventDefault()
  editor.open(field)
}

onMounted(() => {
  syncRegistry()
  editor.setFieldUpdatedHandler((updated) => emit('fieldUpdated', updated))
  rootRef.value?.addEventListener('click', onClick)
  void nextTick(() => runFieldSync())
})

onUnmounted(() => {
  editor.setFieldUpdatedHandler(null)
  rootRef.value?.removeEventListener('click', onClick)
})
</script>

<template>
  <!-- Slot renders the dynamic page template; modal is sibling so it overlays the page. -->
  <div
    ref="rootRef"
    :class="{ 'page--editing': enabled }"
  >
    <slot />
    <FieldEditModal v-if="enabled" />
  </div>
</template>

<style scoped>
/* Visual hint that inline editable regions are clickable when edit mode is on. */
.page--editing :deep([data-name]) {
  cursor: pointer;
}
</style>
