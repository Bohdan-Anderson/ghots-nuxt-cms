<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { parseRichTextValue } from '~/types/fieldValues'

const props = defineProps<{
  field: FieldRow | undefined
}>()

const html = computed(() => parseRichTextValue(props.field?.value ?? null).html)
</script>

<template>
  <div
    class="cms-richtext"
    :data-name="field?.name"
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
