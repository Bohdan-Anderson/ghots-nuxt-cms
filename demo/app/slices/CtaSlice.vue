<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

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
    class="cta-slice"
    :data-slice-id="sliceId"
    data-slice-type="cta"
  >
    <CmsRichText :field="field('copy')" />
    <p class="cta-slice__action">
      <CmsLink :field="field('cta_link')" />
    </p>
  </section>
</template>

<style scoped>
.cta-slice {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}

.cta-slice__action {
  margin: 1rem 0 0;
}
</style>
