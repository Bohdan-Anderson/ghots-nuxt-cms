<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { parseLinkValue } from '~/types/fieldValues'

const props = defineProps<{
  field: FieldRow | undefined
}>()

const link = computed(() => parseLinkValue(props.field?.value ?? null))
</script>

<template>
  <a
    v-if="link.url"
    :href="link.url"
    :target="link.target === '_blank' ? '_blank' : undefined"
    :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
    :data-name="field?.name"
    :data-type="field?.type ?? 'link'"
    :data-id="field?.id ?? ''"
  >
    {{ link.label || link.url }}
  </a>
  <span
    v-else
    :data-name="field?.name"
    :data-type="field?.type ?? 'link'"
    :data-id="field?.id ?? ''"
    class="cms-link-empty"
  >
    (no link)
  </span>
</template>

<style scoped>
.cms-link-empty {
  color: #888;
  font-style: italic;
}
</style>
