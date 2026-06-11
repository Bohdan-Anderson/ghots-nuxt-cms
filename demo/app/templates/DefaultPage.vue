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
      data-type="plain_text"
      :data-id="field('title')?.id ?? ''"
    >
      {{ field('title')?.value }}
    </h1>

    <p
      class="page-subtitle"
      data-name="subtitle"
      data-type="plain_text"
      :data-id="field('subtitle')?.id ?? ''"
    >
      {{ field('subtitle')?.value }}
    </p>

    <section
      data-name="main"
      data-type="section"
      :data-id="field('main')?.id ?? ''"
    >
      <p
        data-name="body"
        data-type="plain_text"
        :data-id="field('body', 'main')?.id ?? ''"
      >
        {{ field('body', 'main')?.value }}
      </p>
    </section>
  </article>
</template>

<style scoped>
.page-subtitle {
  min-height: 1.25rem;
}
</style>
