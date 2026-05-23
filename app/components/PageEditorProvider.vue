<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

/**
 * Wraps a page template for inline CMS editing.
 * Registers field lookups with usePageEditor, delegates clicks on [data-name]
 * elements to open the modal, and bubbles saves to the parent via fieldUpdated.
 * Used from [...slug].vue when a template resolves.
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

/**
 * Keeps usePageEditor's registry in sync with the current page's field maps
 * so resolveFieldFromElement can map clicks to FieldRow instances.
 */
function syncRegistry() {
  editor.registerFields(props.fieldsById, props.fieldsByName)
}

// Re-register when field maps change (e.g. after patchField from parent).
watch(
  () => [props.fieldsById, props.fieldsByName] as const,
  syncRegistry,
  { deep: true },
)

/**
 * Click delegation: finds the nearest [data-name] ancestor and opens the modal
 * for plain_text fields only. Richer field types are edited from the sidebar.
 */
function onClick(event: MouseEvent) {
  if (!props.enabled) return

  const target = event.target as HTMLElement
  const el = target.closest('[data-name]') as HTMLElement | null
  if (!el) return

  const field = editor.resolveFieldFromElement(el)
  if (!field || field.type !== 'plain_text') return

  event.preventDefault()
  editor.open(field)
}

onMounted(() => {
  syncRegistry()
  // Bridge editor saves to parent patchField without storing handler in useState.
  editor.setFieldUpdatedHandler((updated) => emit('fieldUpdated', updated))
  rootRef.value?.addEventListener('click', onClick)
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
/* Visual hint that inline plain_text regions are clickable when edit mode is on. */
.page--editing :deep([data-name]) {
  cursor: pointer;
}
</style>
