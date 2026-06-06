<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { buildContentTree } from '~/composables/buildContentTree'
import { listSliceDefinitions } from '#cms/registries'
import { isEditableFieldType } from '~/fields/registry'

const { pageContent } = useCmsPanel()
const editor = usePageEditor()
const { addSlice, removeSlice, moveSlice, addArrayItem, removeArrayItem } =
  useCmsPageActions()

const sliceTypes = listSliceDefinitions()
const selectedSliceType = ref(sliceTypes[0]?.key ?? '')
const sliceBusy = ref(false)
const arrayBusy = ref(false)

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
 * Adds a new item to a repeatable array field.
 */
async function onAddArrayItem(arrayFieldId: string) {
  if (arrayBusy.value) return
  arrayBusy.value = true
  try {
    await addArrayItem(arrayFieldId)
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
</script>

<template>
  <div class="cms-sidebar-body">
    <p v-if="!pageContent" class="cms-sidebar-hint">
      Open a page to see fields and slices.
    </p>

    <template v-else>
      <p v-if="contentTree.pageFieldNodes.length" class="cms-sidebar-hint">
        Page fields
      </p>
      <CmsSidebarFieldList
        v-if="contentTree.pageFieldNodes.length"
        :nodes="contentTree.pageFieldNodes"
        :fields-by-id="pageContent.fieldsById"
        :fields="pageContent.fields"
        :array-busy="arrayBusy"
        @field-click="onFieldClick"
        @add-item="onAddArrayItem"
        @remove-item="onRemoveArrayItem"
      />

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
          <CmsSidebarFieldList
            :nodes="fields"
            :fields-by-id="pageContent.fieldsById"
            :fields="pageContent.fields"
            :array-busy="arrayBusy"
            @field-click="onFieldClick"
            @add-item="onAddArrayItem"
            @remove-item="onRemoveArrayItem"
          />
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
</template>
