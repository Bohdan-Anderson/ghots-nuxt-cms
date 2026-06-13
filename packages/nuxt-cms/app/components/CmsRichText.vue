<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { parseRichTextValue } from '~/types/fieldValues'

const props = defineProps<{
  field: FieldRow | undefined
  name?: string
}>()

const html = computed(
  () => parseRichTextValue(props.field?.richtext ?? null).html,
)
const fieldName = computed(() => props.name ?? props.field?.name ?? '')
</script>

<template>
  <div
    class="cms-richtext"
    :data-name="fieldName"
    data-type="richtext"
    :data-id="field?.id ?? ''"
    v-html="html"
  />
</template>

<style scoped>
.cms-richtext :deep(p) {
  margin: 0 0 0.75rem;
}

.cms-richtext :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
