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
  <article>
    <h1
      data-name="title"
      :data-id="field('title')?.id ?? ''"
    >
      {{ field('title')?.value }}
    </h1>

    <section
      data-name="main"
      :data-id="field('main')?.id ?? ''"
    >
      <p
        data-name="body"
        :data-id="field('body', 'main')?.id ?? ''"
      >
        {{ field('body', 'main')?.value }}
      </p>
    </section>
  </article>
</template>
