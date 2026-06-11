<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  fields: FieldRow[]
}>()

/**
 * Resolves a field by name, optionally under a parent section.
 */
function field(name: string, parentSectionName?: string): FieldRow | undefined {
  return resolveField(props.fields, name, parentSectionName)
}
</script>

<template>
  <main>
    <h1
      data-name="title"
      data-type="plain_text"
      :data-id="field('title')?.id ?? ''"
    >
      {{ field('title')?.value }}
    </h1>
  </main>
</template>
