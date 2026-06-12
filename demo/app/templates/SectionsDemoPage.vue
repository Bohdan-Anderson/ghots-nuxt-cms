<script setup lang="ts">
import type { FieldRow } from '~/types/cms'
import HeroSection from '~/sections/HeroSection.vue'
import CtaSection from '~/sections/CtaSection.vue'
import TeamSection from '~/sections/TeamSection.vue'

const props = defineProps<{
  pageId: string
  fields: FieldRow[]
  fieldsByParentAndName: Record<string, FieldRow>
}>()

const titleField = computed(() =>
  useCmsField(props.fieldsByParentAndName, null, 'title'),
)
</script>

<template>
  <article
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

    <div class="section-stack">
      <HeroSection
        section-name="hero1"
        :fields-by-parent-and-name="fieldsByParentAndName"
      />
      <HeroSection
        section-name="hero2"
        :fields-by-parent-and-name="fieldsByParentAndName"
      />
      <CtaSection
        section-name="cta"
        :fields-by-parent-and-name="fieldsByParentAndName"
      />
      <TeamSection
        section-name="team"
        :fields="fields"
        :fields-by-parent-and-name="fieldsByParentAndName"
      />
    </div>
  </article>
</template>

<style scoped>
.section-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
