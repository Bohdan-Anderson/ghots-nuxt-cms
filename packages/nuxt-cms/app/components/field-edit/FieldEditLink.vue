<script setup lang="ts">
import { parseLinkValue, type LinkValue } from '~/types/fieldValues'

const draft = defineModel<string>('draft', { required: true })

const link = computed({
  get(): LinkValue {
    try {
      return JSON.parse(draft.value) as LinkValue
    } catch {
      return parseLinkValue(null)
    }
  },
  set(value: LinkValue) {
    draft.value = JSON.stringify(value)
  },
})

/**
 * Updates one link property on the draft JSON.
 */
function patchLink(partial: Partial<LinkValue>) {
  link.value = { ...link.value, ...partial }
}
</script>

<template>
  <div class="field-edit-link">
    <label class="field-edit-link__label">
      URL
      <input
        type="url"
        class="field-edit-modal__input"
        :value="link.url"
        placeholder="https://example.com"
        @input="patchLink({ url: ($event.target as HTMLInputElement).value })"
      />
    </label>
    <label class="field-edit-link__label">
      Label
      <input
        type="text"
        class="field-edit-modal__input"
        :value="link.label"
        placeholder="Read more"
        @input="patchLink({ label: ($event.target as HTMLInputElement).value })"
      />
    </label>
    <label class="field-edit-link__label">
      Open in
      <select
        class="field-edit-modal__input"
        :value="link.target"
        @change="
          patchLink({
            target: ($event.target as HTMLSelectElement).value as
              | '_self'
              | '_blank',
          })
        "
      >
        <option value="_self">Same tab</option>
        <option value="_blank">New tab</option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.field-edit-link {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-edit-link__label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}
</style>
