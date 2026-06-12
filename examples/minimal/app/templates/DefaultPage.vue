<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  pageId: string
  fieldsByParentAndName: Record<string, FieldRow>
}>()

const titleField = computed(() =>
  useCmsField(props.fieldsByParentAndName, null, 'title'),
)
</script>

<template>
  <main
    data-type="page"
    :data-id="pageId"
  >
    <h1
      data-name="title"
      data-type="plain_text"
      :data-id="titleField.id"
    >
      {{ cmsColumnValue(titleField, 'plain_text') }}
    </h1>
  </main>
</template>
