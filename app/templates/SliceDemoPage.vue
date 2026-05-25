<script setup lang="ts">
import type { FieldRow, PageSliceRow } from '~/types/cms'
import { resolveField } from '~/composables/usePageContent'
import { resolveSliceComponent } from '~/slices/registry'

const props = defineProps<{
  pageFields: FieldRow[]
  slices: PageSliceRow[]
  fieldsBySliceId: Record<string, FieldRow[]>
}>()

/**
 * Resolves a page-level field by name.
 */
function field(name: string, parentSectionName?: string): FieldRow | undefined {
  return resolveField(props.pageFields, name, parentSectionName)
}

/**
 * Resolves the Vue component for a slice instance row.
 */
function sliceComponent(slice: PageSliceRow) {
  return resolveSliceComponent(slice.slice_type_key)
}
</script>

<template>
  <article>
    <h1
      data-name="title"
      :data-id="field('title')?.id ?? ''"
    >
      {{ field('title')?.value }}
    </h1>

    <div class="slice-stack">
      <template
        v-for="slice in slices"
        :key="slice.id"
      >
        <component
          :is="sliceComponent(slice)"
          v-if="sliceComponent(slice)"
          :fields="fieldsBySliceId[slice.id] ?? []"
          :slice-id="slice.id"
        />
      </template>
    </div>
  </article>
</template>

<style scoped>
.slice-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
