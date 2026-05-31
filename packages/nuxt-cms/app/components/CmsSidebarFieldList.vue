<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import type { FieldTreeNode } from '~/composables/buildContentTree'
import { previewFieldValue } from '~/fields/registry'
import {
  arrayItemLabel,
  isArrayItemSection,
} from '~/fields/schemaLookup'

const props = defineProps<{
  nodes: FieldTreeNode[]
  fieldsById: Record<string, FieldRow>
  fields: FieldRow[]
  arrayBusy?: boolean
}>()

const emit = defineEmits<{
  'field-click': [field: FieldRow]
  'add-item': [arrayFieldId: string]
  'remove-item': [itemSectionId: string]
}>()

/**
 * Sidebar preview for a field value (type-aware).
 */
function previewValue(field: FieldRow): string {
  return previewFieldValue(field.type, field.value)
}

/**
 * Label for an array item section row in the sidebar.
 */
function arrayItemDisplayLabel(field: FieldRow): string {
  if (!field.parent_id) return field.name
  const parent = props.fieldsById[field.parent_id]
  if (!parent) return field.name
  return arrayItemLabel(field, parent, props.fields)
}
</script>

<template>
  <ul class="cms-sidebar-fields">
    <li
      v-for="{ field, depth } in nodes"
      :key="field.id"
      class="cms-sidebar-field-row"
      :style="{ paddingLeft: `${depth * 0.75}rem` }"
    >
      <div v-if="field.type === 'array'" class="cms-sidebar-array">
        <span class="cms-sidebar-section-label">{{ field.name }}</span>
        <button
          type="button"
          class="cms-sidebar-array-add"
          :disabled="arrayBusy"
          @click="emit('add-item', field.id)"
        >
          Add item
        </button>
      </div>
      <div
        v-else-if="isArrayItemSection(field, fieldsById)"
        class="cms-sidebar-array-item"
      >
        <span class="cms-sidebar-section-label">
          {{ arrayItemDisplayLabel(field) }}
        </span>
        <button
          type="button"
          title="Remove item"
          :disabled="arrayBusy"
          @click="emit('remove-item', field.id)"
        >
          ×
        </button>
      </div>
      <span
        v-else-if="field.type === 'section'"
        class="cms-sidebar-section-label"
      >
        {{ field.name }}
      </span>
      <button
        v-else
        type="button"
        class="cms-sidebar-field-btn"
        @click="emit('field-click', field)"
      >
        {{ field.name }}: {{ previewValue(field) }}
      </button>
    </li>
  </ul>
</template>
