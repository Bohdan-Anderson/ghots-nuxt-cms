<script setup lang="ts">
import type { EditableFieldType, FieldRow } from '~/types/cms'
import { flattenContentTree } from '~/fields/scanContentTree'
import { isEditableFieldType } from '~/fields/registry'

const { pageContent } = useCmsPanel()
const { tree: contentTree } = useContentTree()
const editor = usePageEditor()
const { addArrayItem, removeArrayItem } = useCmsPageActions()

const arrayBusy = ref(false)

const flatNodes = computed(() => flattenContentTree(contentTree.value))

/**
 * Opens the edit modal for an editable field and scrolls to it on the page.
 */
function onFieldClick(field: FieldRow, column: EditableFieldType) {
  editor.focusOnPage(field)
  if (!isEditableFieldType(column)) return
  editor.open(field, column)
}

/**
 * Adds a new item to a repeatable array field.
 */
async function onAddArrayItem(arrayFieldId: string) {
  if (arrayBusy.value) return
  arrayBusy.value = true
  try {
    await addArrayItem(arrayFieldId)
    await nextTick()
  } finally {
    arrayBusy.value = false
  }
}

/**
 * Removes an array item after confirmation.
 */
async function onRemoveArrayItem(itemSectionId: string) {
  if (arrayBusy.value) return
  if (!import.meta.client) return
  if (!window.confirm('Remove this item?')) return
  arrayBusy.value = true
  try {
    await removeArrayItem(itemSectionId)
  } finally {
    arrayBusy.value = false
  }
}
</script>

<template>
  <div class="cms-sidebar-body">
    <p v-if="!pageContent" class="cms-sidebar-hint">
      Open a page to see fields.
    </p>

    <template v-else>
      <p v-if="flatNodes.length" class="cms-sidebar-hint">
        Page content
      </p>
      <CmsSidebarFieldList
        v-if="flatNodes.length"
        :nodes="flatNodes"
        :fields-by-id="pageContent.fieldsById"
        :fields="pageContent.fields"
        :array-busy="arrayBusy"
        @field-click="onFieldClick"
        @add-item="onAddArrayItem"
        @remove-item="onRemoveArrayItem"
      />
      <p
        v-else
        class="cms-sidebar-hint"
      >
        Content tree builds after the page renders.
      </p>
    </template>
  </div>
</template>
