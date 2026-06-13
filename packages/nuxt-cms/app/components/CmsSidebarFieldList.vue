<script setup lang="ts">
import type { ContentTreeNode, EditableFieldType, FieldRow } from '~/types/cms'
import { previewFieldValue } from '~/fields/registry'
import { getFieldColumnValue } from '~/fields/fieldValues'
import { arrayItemLabel, isArrayItemSection } from '~/fields/schemaLookup'

const props = defineProps<{
  nodes: ContentTreeNode[]
  fieldsById: Record<string, FieldRow>
  fields: FieldRow[]
  arrayBusy?: boolean
}>()

const emit = defineEmits<{
  'field-click': [field: FieldRow, column: EditableFieldType]
  'add-item': [arrayFieldId: string]
  'remove-item': [itemSectionId: string]
}>()

/**
 * Resolves a DB field row for a tree node (by id or parent + name).
 */
function resolveFieldFor(node: ContentTreeNode): FieldRow | undefined {
  if (node.id && props.fieldsById[node.id]) {
    return props.fieldsById[node.id]
  }

  const parentId = node.parentFieldId ?? null
  return props.fields.find(
    (field) => field.name === node.name && field.parent_id === parentId,
  )
}

/**
 * Returns a stable field id for array actions.
 */
function resolvedFieldId(node: ContentTreeNode): string | null {
  return resolveFieldFor(node)?.id ?? node.id
}

/**
 * Sidebar preview for a tree node's value column.
 */
function previewValue(node: ContentTreeNode): string {
  const field = resolveFieldFor(node)
  const column = node.previewColumn
  if (!field || !column) return '(empty)'
  return previewFieldValue(column, getFieldColumnValue(field, column))
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

/**
 * Opens the edit modal for an editable leaf node.
 */
function onNodeClick(node: ContentTreeNode) {
  const field = resolveFieldFor(node)
  const column = node.previewColumn
  if (!field?.id || !column) return
  emit('field-click', field, column)
}
</script>

<template>
  <ul class="cms-sidebar-fields">
    <li
      v-for="node in nodes"
      :key="node.id ?? `${node.depth}-${node.name}`"
      class="cms-sidebar-field-row"
      :style="{ paddingLeft: `${node.depth * 0.75}rem` }"
    >
      <div
        v-if="
          node.domType === 'array' || resolveFieldFor(node)?.kind === 'array'
        "
        class="cms-sidebar-array"
      >
        <span class="cms-sidebar-section-label">{{ node.name }}</span>
        <button
          v-if="resolvedFieldId(node)"
          type="button"
          class="cms-sidebar-array-add"
          :disabled="arrayBusy"
          @click="emit('add-item', resolvedFieldId(node)!)"
        >
          Add item
        </button>
      </div>
      <div
        v-else-if="
          resolveFieldFor(node) &&
          isArrayItemSection(resolveFieldFor(node)!, fieldsById)
        "
        class="cms-sidebar-array-item"
      >
        <span class="cms-sidebar-section-label">
          {{ arrayItemDisplayLabel(resolveFieldFor(node)!) }}
        </span>
        <button
          type="button"
          title="Remove item"
          :disabled="arrayBusy"
          @click="emit('remove-item', resolveFieldFor(node)!.id)"
        >
          ×
        </button>
      </div>
      <span
        v-else-if="node.domType === 'section' || node.domType === 'page'"
        class="cms-sidebar-section-label"
      >
        {{ node.name }}
      </span>
      <button
        v-else-if="node.previewColumn"
        type="button"
        class="cms-sidebar-field-btn"
        @click="onNodeClick(node)"
      >
        {{ node.name }}: {{ previewValue(node) }}
      </button>
    </li>
  </ul>
</template>
