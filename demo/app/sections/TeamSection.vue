<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  sectionName: string
  fields: FieldRow[]
  fieldsByParentAndName: Record<string, FieldRow>
  parentId?: string | null
}>()

const sectionField = computed(() =>
  useCmsField(props.fieldsByParentAndName, props.parentId ?? null, props.sectionName),
)

function field(name: string): FieldRow {
  return useCmsField(
    props.fieldsByParentAndName,
    sectionField.value.id || null,
    name,
  )
}

const membersArray = computed(() => field('members'))

const memberSections = computed(() => {
  if (!membersArray.value.id) return []
  return props.fields
    .filter(
      (row) =>
        row.parent_id === membersArray.value.id && row.kind === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)
})

/**
 * Returns child fields for an array item section.
 */
function itemFields(itemSectionId: string): FieldRow[] {
  return props.fields
    .filter((row) => row.parent_id === itemSectionId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

function itemField(itemSectionId: string, name: string): FieldRow | undefined {
  return itemFields(itemSectionId).find((row) => row.name === name)
}
</script>

<template>
  <section
    class="team-section"
    :data-name="sectionName"
    data-type="section"
    :data-id="sectionField.id"
  >
    <h2
      data-name="heading"
      data-type="plain_text"
      :data-id="field('heading').id"
    >
      {{ cmsColumnValue(field('heading'), 'plain_text') }}
    </h2>

    <div
      data-name="members"
      data-type="array"
      :data-id="membersArray.id"
      hidden
    />

    <ul class="team-section__members">
      <li
        v-for="itemSection in memberSections"
        :key="itemSection.id"
        class="team-section__member"
        data-type="section"
        :data-name="itemSection.name"
        :data-id="itemSection.id"
      >
        <CmsImage
          :field="itemField(itemSection.id, 'photo')"
          name="photo"
        />
        <p
          class="team-section__name"
          data-name="name"
          data-type="plain_text"
          :data-id="itemField(itemSection.id, 'name')?.id ?? ''"
        >
          {{
            cmsColumnValue(
              itemField(itemSection.id, 'name') ?? field('name'),
              'plain_text',
            )
          }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.team-section {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}

.team-section__members {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.team-section__member {
  flex: 0 1 8rem;
  text-align: center;
}

.team-section__member :deep(.cms-image) {
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto;
}

.team-section__name {
  margin: 0.5rem 0 0;
  font-weight: 600;
}
</style>
