<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  fields: FieldRow[]
  sliceId: string
}>()

/**
 * Resolves a field within this slice instance.
 */
function field(name: string, parentSectionName?: string): FieldRow | undefined {
  return resolveField(props.fields, name, parentSectionName, props.sliceId)
}

/**
 * Returns ordered array item field groups for the members list.
 */
const members = computed(() =>
  resolveArrayItems(props.fields, 'members', props.sliceId),
)

/**
 * Resolves a field inside an array item section.
 */
function itemField(itemFields: FieldRow[], name: string): FieldRow | undefined {
  return itemFields.find((row) => row.name === name)
}
</script>

<template>
  <section
    class="team-slice"
    :data-slice-id="sliceId"
    data-slice-type="team"
  >
    <h2
      data-name="heading"
      data-type="plain_text"
      :data-id="field('heading')?.id ?? ''"
    >
      {{ field('heading')?.value }}
    </h2>

    <ul class="team-slice__members">
      <li
        v-for="(itemFields, index) in members"
        :key="itemFields[0]?.parent_id ?? index"
        class="team-slice__member"
      >
        <CmsImage :field="itemField(itemFields, 'photo')" />
        <p
          class="team-slice__name"
          data-name="name"
          :data-id="itemField(itemFields, 'name')?.id ?? ''"
        >
          {{ itemField(itemFields, 'name')?.value }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.team-slice {
  padding: 1.5rem;
  margin-block: 1rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 0.5rem;
}

.team-slice__members {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.team-slice__member {
  flex: 0 1 8rem;
  text-align: center;
}

.team-slice__member :deep(.cms-image) {
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto;
}

.team-slice__name {
  margin: 0.5rem 0 0;
  font-weight: 600;
}
</style>
