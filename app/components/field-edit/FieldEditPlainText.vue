<script setup lang="ts">
const draft = defineModel<string>('draft', { required: true })
</script>

<template>
  <textarea
    v-model="draft"
    rows="8"
    class="field-edit-modal__input"
  />
</template>
