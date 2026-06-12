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

const members = computed(() => {
  if (!membersArray.value.id) return []
  return resolveArrayItems(props.fields, membersArray.value.id)
})

function itemField(itemFields: FieldRow[], name: string): FieldRow | undefined {
  return itemFields.find((row) => row.name === name)
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
        v-for="(itemFields, index) in members"
        :key="itemFields[0]?.parent_id ?? index"
        class="team-section__member"
        data-type="section"
        :data-name="itemFields[0]?.name ?? `item_${index}`"
        :data-id="itemFields[0]?.id ?? ''"
      >
        <CmsImage :field="itemField(itemFields, 'photo')" name="photo" />
        <p
          class="team-section__name"
          data-name="name"
          data-type="plain_text"
          :data-id="itemField(itemFields, 'name')?.id ?? ''"
        >
          {{ cmsColumnValue(itemField(itemFields, 'name') ?? field('name'), 'plain_text') }}
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
