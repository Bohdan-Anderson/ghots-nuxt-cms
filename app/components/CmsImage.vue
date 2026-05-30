<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import { parseImageValue } from '~/types/fieldValues'

const props = defineProps<{
  field: FieldRow | undefined
}>()

const image = computed(() => parseImageValue(props.field?.value ?? null))
</script>

<template>
  <img
    v-if="image.url"
    :src="image.url"
    :alt="image.alt"
    :data-name="field?.name"
    :data-id="field?.id ?? ''"
    class="cms-image"
  />
  <span
    v-else
    :data-name="field?.name"
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
