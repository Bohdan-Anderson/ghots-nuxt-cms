<script setup lang="ts">
const {
  activeField,
  draftValue,
  isOpen,
  close,
  save,
  setDraft,
} = usePageEditor()

const saving = ref(false)
const errorMessage = ref('')

/**
 * Saves the draft and closes the modal.
 */
async function handleSave() {
  saving.value = true
  errorMessage.value = ''
  try {
    await save()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <dialog
    :open="isOpen"
    class="field-edit-modal"
    @close="close"
  >
    <form
      class="field-edit-modal__form"
      @submit.prevent="handleSave"
    >
      <h2 class="field-edit-modal__title">
        Edit {{ activeField?.name }}
      </h2>
      <textarea
        :value="draftValue"
        rows="8"
        class="field-edit-modal__input"
        @input="setDraft(($event.target as HTMLTextAreaElement).value)"
      />
      <p
        v-if="errorMessage"
        class="field-edit-modal__error"
      >
        {{ errorMessage }}
      </p>
      <div class="field-edit-modal__actions">
        <button
          type="button"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.field-edit-modal {
  border: 1px solid #ccc;
  padding: 1rem;
  max-width: 32rem;
  width: 90%;
}

.field-edit-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-edit-modal__title {
  margin: 0;
  font-size: 1rem;
}

.field-edit-modal__input {
  width: 100%;
  box-sizing: border-box;
}

.field-edit-modal__error {
  margin: 0;
  color: #c00;
  font-size: 0.875rem;
}

.field-edit-modal__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
