import type { Component } from 'vue'
import type { FieldType } from '~/types/cms'
import {
  parseLinkValue,
  parseRichTextValue,
  parseImageValue,
  serializeLinkValue,
  serializeRichTextValue,
  serializeImageValue,
  type LinkValue,
  type ImageValue,
} from '~/types/fieldValues'
import { markdownToHtml } from '~/utils/markdownToHtml'
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import FieldEditPlainText from '~/components/field-edit/FieldEditPlainText.vue'
import FieldEditLink from '~/components/field-edit/FieldEditLink.vue'
import FieldEditRichText from '~/components/field-edit/FieldEditRichText.vue'
import FieldEditImage from '~/components/field-edit/FieldEditImage.vue'

export interface FieldTypeConfig {
  type: FieldType
  /** Modal body component for this field type. */
  editComponent: Component
  /** Opens from on-page click delegation when true. */
  supportsOnPageClick: boolean
  /** Converts DB value to modal draft string. */
  valueToDraft: (value: string | null) => string
  /** Converts modal draft to DB value string. */
  draftToValue: (draft: string) => string
  /** Short label for sidebar field preview. */
  preview: (value: string | null) => string
}

const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeConfig | null> = {
  section: null,
  plain_text: {
    type: 'plain_text',
    editComponent: FieldEditPlainText,
    supportsOnPageClick: true,
    valueToDraft: (value) => value ?? '',
    draftToValue: (draft) => draft,
    preview: (value) => {
      if (!value) return '(empty)'
      return value.length > 40 ? `${value.slice(0, 40)}…` : value
    },
  },
  link: {
    type: 'link',
    editComponent: FieldEditLink,
    supportsOnPageClick: true,
    valueToDraft: (value) => JSON.stringify(parseLinkValue(value)),
    draftToValue: (draft) => {
      try {
        const parsed = JSON.parse(draft) as LinkValue
        return serializeLinkValue(parsed)
      } catch {
        return serializeLinkValue({ url: '', label: '', target: '_self' })
      }
    },
    preview: (value) => {
      const link = parseLinkValue(value)
      if (!link.url) return '(empty link)'
      const label = link.label || link.url
      return label.length > 40 ? `${label.slice(0, 40)}…` : label
    },
  },
  richtext: {
    type: 'richtext',
    editComponent: FieldEditRichText,
    supportsOnPageClick: true,
    valueToDraft: (value) => parseRichTextValue(value).source,
    draftToValue: (draft) => {
      const rawHtml = markdownToHtml(draft)
      const html = sanitizeHtml(rawHtml)
      return serializeRichTextValue({ source: draft, html })
    },
    preview: (value) => {
      const { source } = parseRichTextValue(value)
      if (!source.trim()) return '(empty)'
      const flat = source.replace(/\s+/g, ' ').trim()
      return flat.length > 40 ? `${flat.slice(0, 40)}…` : flat
    },
  },
  image: {
    type: 'image',
    editComponent: FieldEditImage,
    supportsOnPageClick: true,
    valueToDraft: (value) => JSON.stringify(parseImageValue(value)),
    draftToValue: (draft) => {
      try {
        const parsed = JSON.parse(draft) as ImageValue
        return serializeImageValue(parsed)
      } catch {
        return serializeImageValue({ url: '', alt: '' })
      }
    },
    preview: (value) => {
      const image = parseImageValue(value)
      if (!image.url) return '(no image)'
      const label = image.alt || image.url
      return label.length > 40 ? `${label.slice(0, 40)}…` : label
    },
  },
  array: null,
}

/**
 * Returns config for an editable field type, or null for structural types.
 */
export function getFieldTypeConfig(
  type: FieldType,
): FieldTypeConfig | null {
  return FIELD_TYPE_REGISTRY[type] ?? null
}

/**
 * Whether the field type can be edited in the modal (not `section`).
 */
export function isEditableFieldType(type: FieldType): boolean {
  return getFieldTypeConfig(type) !== null
}

/**
 * Whether clicks on `[data-name]` elements should open the modal.
 */
export function fieldTypeSupportsOnPageClick(type: FieldType): boolean {
  return getFieldTypeConfig(type)?.supportsOnPageClick ?? false
}

/**
 * Default `fields.value` when seeding from schema.
 */
export function defaultValueForFieldType(
  type: FieldType,
  schemaDefault?: string,
): string | null {
  switch (type) {
    case 'plain_text':
      return schemaDefault ?? ''
    case 'link':
      return serializeLinkValue({
        url: schemaDefault ?? '',
        label: '',
        target: '_self',
      })
    case 'richtext': {
      const source = schemaDefault ?? ''
      const html = source ? sanitizeHtml(markdownToHtml(source)) : ''
      return serializeRichTextValue({ source, html })
    }
    case 'image':
      return serializeImageValue({
        url: schemaDefault ?? '',
        alt: '',
      })
    default:
      return null
  }
}

/**
 * Sidebar preview text for a field value.
 */
export function previewFieldValue(
  type: FieldType,
  value: string | null,
): string {
  const config = getFieldTypeConfig(type)
  if (!config) return ''
  return config.preview(value)
}
