<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { parseImageValue } from '~/types/fieldValues'

const props = defineProps<{
  field: FieldRow | undefined
  name?: string
}>()

const image = computed(() => parseImageValue(props.field?.image ?? null))
const fieldName = computed(() => props.name ?? props.field?.name ?? '')
</script>

<template>
  <img
    v-if="image.url"
    :src="image.url"
    :alt="image.alt"
    :data-name="fieldName"
    data-type="image"
    :data-id="field?.id ?? ''"
    class="cms-image"
  />
  <span
    v-else
    :data-name="fieldName"
    data-type="image"
    :data-id="field?.id ?? ''"
    class="cms-image-empty"
  >
    (no image)
  </span>
</template>

<style scoped>
.cms-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.cms-image-empty {
  color: #888;
  font-style: italic;
}
</style>
