<script setup lang="ts">
import {
  parseImageValue,
  serializeImageValue,
  type ImageValue,
} from '~/types/fieldValues'
import { uploadCmsImage } from '~/composables/useImageUpload'

const draft = defineModel<string>('draft', { required: true })

const props = defineProps<{
  fieldId: string
}>()

const image = computed(() => parseImageValue(draft.value))
const uploading = ref(false)
const uploadError = ref('')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

/**
 * Updates alt text in the draft JSON.
 */
function setAlt(alt: string) {
  draft.value = serializeImageValue({ ...image.value, alt })
}

/**
 * Uploads the selected file and stores the public URL in the draft.
 */
async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  uploadError.value = ''

  try {
    const url = await uploadCmsImage(props.fieldId, file)
    const next: ImageValue = {
      url,
      alt: image.value.alt || file.name.replace(/\.[^.]+$/, ''),
    }
    draft.value = serializeImageValue(next)
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Upload failed'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

/**
 * Clears the image URL while keeping alt text.
 */
function clearImage() {
  draft.value = serializeImageValue({ url: '', alt: image.value.alt })
}
</script>

<template>
  <div class="field-edit-image">
    <div
      v-if="image.url"
      class="field-edit-image__preview"
    >
      <img
        :src="image.url"
        :alt="image.alt || 'Preview'"
      />
      <button
        type="button"
        @click="clearImage"
      >
        Remove image
      </button>
    </div>

    <label class="field-edit-image__file">
      {{
        uploading ? 'Uploading…' : image.url ? 'Replace image' : 'Choose image'
      }}
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        :disabled="uploading"
        @change="onFileSelected"
      />
    </label>

    <label>
      Alt text
      <input
        class="field-edit-modal__input"
        type="text"
        :value="image.alt"
        @input="setAlt(($event.target as HTMLInputElement).value)"
      />
    </label>

    <p
      v-if="uploadError"
      class="field-edit-image__error"
    >
      {{ uploadError }}
    </p>
  </div>
</template>

<style scoped>
.field-edit-image {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-edit-image__preview img {
  display: block;
  max-width: 100%;
  max-height: 12rem;
  object-fit: contain;
  border: 1px solid #ccc;
}

.field-edit-image__preview button {
  margin-top: 0.375rem;
  font: inherit;
  cursor: pointer;
}

.field-edit-image__file input[type='file'] {
  display: block;
  margin-top: 0.25rem;
  font: inherit;
}

.field-edit-image__error {
  margin: 0;
  color: #c00;
  font-size: 0.875rem;
}
</style>
