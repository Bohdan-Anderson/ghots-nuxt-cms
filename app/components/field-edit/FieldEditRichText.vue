<script setup lang="ts">
const draft = defineModel<string>('draft', { required: true })
</script>

<template>
  <div class="field-edit-richtext">
    <p class="field-edit-richtext__hint">
      Markdown: paragraphs (blank line), **bold**, *italic*,
      [label](https://url)
    </p>
    <textarea
      v-model="draft"
      rows="10"
      class="field-edit-modal__input"
    />
  </div>
</template>

<style scoped>
.field-edit-richtext__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #666;
}
</style>
