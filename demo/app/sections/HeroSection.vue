<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  sectionName: string
  fieldsByParentAndName: Record<string, FieldRow>
  parentId?: string | null
}>()

/**
 * Resolves the section container row.
 */
const sectionField = computed(() =>
  useCmsField(
    props.fieldsByParentAndName,
    props.parentId ?? null,
    props.sectionName,
  ),
)

/**
 * Resolves a field within this section.
 */
function field(name: string): FieldRow {
  return useCmsField(
    props.fieldsByParentAndName,
    sectionField.value.id || null,
    name,
  )
}
</script>

<template>
  <section
    class="hero-section"
    :data-name="sectionName"
    data-type="section"
    :data-id="sectionField.id"
  >
    <h2
      data-name="headline"
      data-type="plain_text"
      :data-id="field('headline').id"
    >
      {{ cmsColumnValue(field('headline'), 'plain_text') }}
    </h2>
  </section>
</template>

<style scoped>
.hero-section {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}
</style>
