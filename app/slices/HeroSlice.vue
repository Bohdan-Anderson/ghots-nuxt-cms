<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { resolveField } from '~/composables/usePageContent'

const props = defineProps<{
  fields: FieldRow[]
  sliceId: string
}>()

/**
 * Resolves a field within this slice instance.
 */
function field(name: string, parentSectionName?: string): FieldRow | undefined {
  return resolveField(props.fields, name, parentSectionName, props.sliceId)
}
</script>

<template>
  <section
    class="hero-slice"
    :data-slice-id="sliceId"
    data-slice-type="hero"
  >
    <h2
      data-name="headline"
      :data-id="field('headline')?.id ?? ''"
    >
      {{ field('headline')?.value }}
    </h2>
  </section>
</template>

<style scoped>
.hero-slice {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}
</style>
