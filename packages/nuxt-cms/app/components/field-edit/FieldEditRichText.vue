<script setup lang="ts">
import {
  applyOrderedListPrefix,
  applyUnorderedListPrefix,
} from '~/utils/markdownListPrefix'

const draft = defineModel<string>('draft', { required: true })

const textareaRef = ref<HTMLTextAreaElement | null>(null)

/**
 * Replaces the textarea selection and restores focus + caret.
 */
function replaceSelection(
  nextValue: string,
  selectionStart: number,
  selectionEnd: number,
) {
  draft.value = nextValue
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(selectionStart, selectionEnd)
  })
}

/**
 * Inserts or converts the current line(s) to an unordered list.
 */
function insertUnorderedList() {
  const textarea = textareaRef.value
  if (!textarea) return

  const result = applyUnorderedListPrefix({
    value: draft.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
  })
  replaceSelection(result.value, result.selectionStart, result.selectionEnd)
}

/**
 * Inserts or converts the current line(s) to an ordered list.
 */
function insertOrderedList() {
  const textarea = textareaRef.value
  if (!textarea) return

  const result = applyOrderedListPrefix({
    value: draft.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd,
  })
  replaceSelection(result.value, result.selectionStart, result.selectionEnd)
}
</script>

<template>
  <div class="field-edit-richtext">
    <div
      class="field-edit-richtext__toolbar"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <button
        type="button"
        class="field-edit-richtext__tool"
        title="Bullet list"
        aria-label="Bullet list"
        @click="insertUnorderedList"
      >
        • List
      </button>
      <button
        type="button"
        class="field-edit-richtext__tool"
        title="Numbered list"
        aria-label="Numbered list"
        @click="insertOrderedList"
      >
        1. List
      </button>
    </div>
    <p class="field-edit-richtext__hint">
      Markdown: paragraphs (blank line), **bold**, *italic*,
      [label](https://url), - bullet list, 1. numbered list
    </p>
    <textarea
      ref="textareaRef"
      v-model="draft"
      rows="10"
      class="field-edit-modal__input"
    />
  </div>
</template>

<style scoped>
.field-edit-richtext__toolbar {
  display: flex;
  gap: 0.375rem;
}

.field-edit-richtext__tool {
  border: 1px solid #ccc;
  background: #f7f7f7;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
}

.field-edit-richtext__tool:hover {
  background: #eee;
}

.field-edit-richtext__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #666;
}
</style>
