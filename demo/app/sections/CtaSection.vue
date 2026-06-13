<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  sectionName: string
  fieldsByParentAndName: Record<string, FieldRow>
  parentId?: string | null
}>()

const sectionField = computed(() =>
  useCmsField(
    props.fieldsByParentAndName,
    props.parentId ?? null,
    props.sectionName,
  ),
)

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
    class="cta-section"
    :data-name="sectionName"
    data-type="section"
    :data-id="sectionField.id"
  >
    <CmsRichText
      :field="field('copy')"
      name="copy"
    />
    <p class="cta-section__action">
      <CmsLink
        :field="field('cta_link')"
        name="cta_link"
      />
    </p>
  </section>
</template>

<style scoped>
.cta-section {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}

.cta-section__action {
  margin: 1rem 0 0;
}
</style>
