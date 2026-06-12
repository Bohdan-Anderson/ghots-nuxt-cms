<script setup lang="ts">
import type { ContentTreeNode, EditableFieldType, FieldRow } from '~/types/cms'
import { previewFieldValue } from '~/fields/registry'
import { getFieldColumnValue } from '~/fields/fieldValues'
import {
  arrayItemLabel,
  isArrayItemSection,
} from '~/fields/schemaLookup'

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
 * Finds the parent section/array field id for a tree node by walking up the flat list.
 */
function parentIdFor(node: ContentTreeNode, index: number): string | null {
  for (let i = index - 1; i >= 0; i--) {
    const ancestor = props.nodes[i]!
    if (ancestor.depth >= node.depth) continue

    const ancestorField = resolveFieldFor(ancestor, i)
    if (ancestor.domType === 'section' || ancestor.domType === 'array') {
      return ancestorField?.id ?? ancestor.id ?? null
    }
    if (ancestor.domType === 'page') return null
  }
  return null
}

/**
 * Resolves a DB field row for a tree node (by id or parent + name).
 */
function resolveFieldFor(
  node: ContentTreeNode,
  index: number,
): FieldRow | undefined {
  if (node.id && props.fieldsById[node.id]) {
    return props.fieldsById[node.id]
  }

  const parentId = parentIdFor(node, index)
  return props.fields.find(
    (field) => field.name === node.name && field.parent_id === parentId,
  )
}

/**
 * Returns a stable field id for array actions.
 */
function resolvedFieldId(node: ContentTreeNode, index: number): string | null {
  return resolveFieldFor(node, index)?.id ?? node.id
}

/**
 * Sidebar preview for a tree node's value column.
 */
function previewValue(node: ContentTreeNode, index: number): string {
  const field = resolveFieldFor(node, index)
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
function onNodeClick(node: ContentTreeNode, index: number) {
  const field = resolveFieldFor(node, index)
  const column = node.previewColumn
  if (!field?.id || !column) return
  emit('field-click', field, column)
}
</script>

<template>
  <ul class="cms-sidebar-fields">
    <li
      v-for="(node, index) in nodes"
      :key="node.id ?? `${node.depth}-${node.name}`"
      class="cms-sidebar-field-row"
      :style="{ paddingLeft: `${node.depth * 0.75}rem` }"
    >
      <div
        v-if="node.domType === 'array' || resolveFieldFor(node, index)?.kind === 'array'"
        class="cms-sidebar-array"
      >
        <span class="cms-sidebar-section-label">{{ node.name }}</span>
        <button
          v-if="resolvedFieldId(node, index)"
          type="button"
          class="cms-sidebar-array-add"
          :disabled="arrayBusy"
          @click="emit('add-item', resolvedFieldId(node, index)!)"
        >
          Add item
        </button>
      </div>
      <div
        v-else-if="resolveFieldFor(node, index) && isArrayItemSection(resolveFieldFor(node, index)!, fieldsById)"
        class="cms-sidebar-array-item"
      >
        <span class="cms-sidebar-section-label">
          {{ arrayItemDisplayLabel(resolveFieldFor(node, index)!) }}
        </span>
        <button
          type="button"
          title="Remove item"
          :disabled="arrayBusy"
          @click="emit('remove-item', resolveFieldFor(node, index)!.id)"
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
        @click="onNodeClick(node, index)"
      >
        {{ node.name }}: {{ previewValue(node, index) }}
      </button>
    </li>
  </ul>
</template>
