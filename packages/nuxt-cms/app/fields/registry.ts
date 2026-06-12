import type { Component } from 'vue'
import type { EditableFieldType, FieldRow, ValueColumn } from '~/types/cms'
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
import { getFieldColumnValue } from '~/fields/fieldValues'
import { markdownToHtml } from '~/utils/markdownToHtml'
import { sanitizeHtml } from '~/utils/sanitizeHtml'
import FieldEditPlainText from '~/components/field-edit/FieldEditPlainText.vue'
import FieldEditLink from '~/components/field-edit/FieldEditLink.vue'
import FieldEditRichText from '~/components/field-edit/FieldEditRichText.vue'
import FieldEditImage from '~/components/field-edit/FieldEditImage.vue'

export interface FieldTypeConfig {
  column: ValueColumn
  /** Modal body component for this field type. */
  editComponent: Component
  /** Opens from on-page click delegation when true. */
  supportsOnPageClick: boolean
  /** Converts DB column value to modal draft string. */
  valueToDraft: (value: string | null) => string
  /** Converts modal draft to DB column value string. */
  draftToValue: (draft: string) => string
  /** Short label for sidebar field preview. */
  preview: (value: string | null) => string
}

const FIELD_TYPE_REGISTRY: Record<EditableFieldType, FieldTypeConfig> = {
  plain_text: {
    column: 'plain_text',
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
    column: 'link',
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
    column: 'richtext',
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
    column: 'image',
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
}

/**
 * Returns config for an editable value column type.
 */
export function getFieldTypeConfig(
  column: EditableFieldType,
): FieldTypeConfig | null {
  return FIELD_TYPE_REGISTRY[column] ?? null
}

/**
 * Whether the column type can be edited in the modal.
 */
export function isEditableFieldType(column: EditableFieldType): boolean {
  return getFieldTypeConfig(column) !== null
}

/**
 * Whether clicks on `[data-name]` elements should open the modal.
 */
export function fieldTypeSupportsOnPageClick(
  column: EditableFieldType,
): boolean {
  return getFieldTypeConfig(column)?.supportsOnPageClick ?? false
}

/**
 * Sidebar preview text for a field value column.
 */
export function previewFieldValue(
  column: EditableFieldType,
  value: string | null,
): string {
  const config = getFieldTypeConfig(column)
  if (!config) return ''
  return config.preview(value)
}

/**
 * Sidebar preview for a field row using its preview column or first populated column.
 */
export function previewFieldRow(
  field: FieldRow,
  column: EditableFieldType,
): string {
  return previewFieldValue(column, getFieldColumnValue(field, column))
}
