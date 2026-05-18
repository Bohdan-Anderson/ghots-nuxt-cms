<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  enabled: boolean
  fields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>
}>()

const emit = defineEmits<{
  fieldUpdated: [field: FieldRow]
}>()

const rootRef = ref<HTMLElement | null>(null)
const editor = usePageEditor()

function syncRegistry() {
  editor.registerFields(props.fieldsById, props.fieldsByName)
}

watch(
  () => [props.fieldsById, props.fieldsByName] as const,
  syncRegistry,
  { deep: true },
)

/**
 * Handles click delegation for editable fields.
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
  editor.setFieldUpdatedHandler((updated) => emit('fieldUpdated', updated))
  rootRef.value?.addEventListener('click', onClick)
})

onUnmounted(() => {
  editor.setFieldUpdatedHandler(null)
  rootRef.value?.removeEventListener('click', onClick)
})
</script>

<template>
  <div
    ref="rootRef"
    :class="{ 'page--editing': enabled }"
  >
    <slot />
    <FieldEditModal v-if="enabled" />
  </div>
</template>

<style scoped>
.page--editing :deep([data-name]) {
  cursor: pointer;
}
</style>
