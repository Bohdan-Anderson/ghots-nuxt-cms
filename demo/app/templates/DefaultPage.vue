<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  pageId: string
  fieldsByParentAndName: Record<string, FieldRow>
}>()

/**
 * Resolves a page-level field by name and optional parent section id.
 */
function field(name: string, parentId: string | null = null): FieldRow {
  return useCmsField(props.fieldsByParentAndName, parentId, name)
}
</script>

<template>
  <article
    data-type="page"
    :data-id="pageId"
  >
    <h1
      data-name="title"
      data-type="plain_text"
      :data-id="field('title').id"
    >
      {{ cmsColumnValue(field('title'), 'plain_text') }}
    </h1>

    <p
      class="page-subtitle"
      data-name="subtitle"
      data-type="plain_text"
      :data-id="field('subtitle').id"
    >
      {{ cmsColumnValue(field('subtitle'), 'plain_text') }}
    </p>

    <section
      data-name="main"
      data-type="section"
      :data-id="field('main').id"
    >
      <p
        data-name="body"
        data-type="plain_text"
        :data-id="field('body', field('main').id || null).id"
      >
        {{ cmsColumnValue(field('body', field('main').id || null), 'plain_text') }}
      </p>
    </section>
  </article>
</template>

<style scoped>
.page-subtitle {
  min-height: 1.25rem;
}
</style>
