import type { FieldType } from '~/types/cms'
import {
  parseImageValue,
  parseLinkValue,
  parseRichTextValue,
  serializeImageValue,
  serializeLinkValue,
  serializeRichTextValue,
} from '~/types/fieldValues'
import { markdownToHtml } from '~/utils/markdownToHtml'
import { sanitizeHtml } from '~/utils/sanitizeHtml'

const STRUCTURED_TYPES = new Set<FieldType>(['link', 'richtext', 'image'])

/**
 * Returns true for editable leaf field types.
 */
export function isLeafFieldType(type: FieldType): boolean {
  return type === 'plain_text' || STRUCTURED_TYPES.has(type)
}

/**
 * Returns true when a structured field value is not valid JSON.
 */
export function isValueMalformedForType(
  type: FieldType,
  value: string | null,
): boolean {
  if (!STRUCTURED_TYPES.has(type) || value == null || value === '') {
    return false
  }

  try {
    JSON.parse(value)
    return false
  } catch {
    return true
  }
}

/**
 * Returns true if the URL string looks like an absolute or root-relative URL.
 */
function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  )
}

/**
 * Re-wraps a raw string into the correct JSON shape for a structured field type.
 */
export function repairFieldValueFormat(
  type: FieldType,
  value: string | null,
): string | null {
  if (!value || !STRUCTURED_TYPES.has(type)) return value
  if (!isValueMalformedForType(type, value)) return value

  const raw = value

  switch (type) {
    case 'link':
      return serializeLinkValue({
        url: raw,
        label: raw,
        target: '_self',
      })
    case 'richtext': {
      const html = sanitizeHtml(markdownToHtml(raw))
      return serializeRichTextValue({ source: raw, html })
    }
    case 'image':
      return serializeImageValue({
        url: looksLikeUrl(raw) ? raw.trim() : '',
        alt: looksLikeUrl(raw) ? '' : raw,
      })
    default:
      return value
  }
}

/**
 * Coerces a field value when changing from one leaf type to another without data loss.
 */
export function migrateFieldValue(
  fromType: FieldType,
  toType: FieldType,
  value: string | null,
): string | null {
  if (fromType === toType) {
    return repairFieldValueFormat(toType, value)
  }

  if (!isLeafFieldType(fromType) || !isLeafFieldType(toType)) {
    return value
  }

  const raw = value ?? ''

  if (fromType === 'plain_text' && toType === 'richtext') {
    const html = raw ? sanitizeHtml(markdownToHtml(raw)) : ''
    return serializeRichTextValue({ source: raw, html })
  }

  if (fromType === 'richtext' && toType === 'plain_text') {
    return parseRichTextValue(raw).source
  }

  if (fromType === 'plain_text' && toType === 'link') {
    return serializeLinkValue({ url: raw, label: raw, target: '_self' })
  }

  if (fromType === 'link' && toType === 'plain_text') {
    const link = parseLinkValue(raw)
    return link.label || link.url
  }

  if (fromType === 'plain_text' && toType === 'image') {
    return serializeImageValue({
      url: looksLikeUrl(raw) ? raw.trim() : '',
      alt: looksLikeUrl(raw) ? '' : raw,
    })
  }

  if (fromType === 'image' && toType === 'plain_text') {
    const image = parseImageValue(raw)
    return image.alt || image.url
  }

  if (fromType === 'richtext' && toType === 'link') {
    const source = parseRichTextValue(raw).source
    return serializeLinkValue({ url: source, label: source, target: '_self' })
  }

  if (fromType === 'link' && toType === 'richtext') {
    const label = parseLinkValue(raw).label || parseLinkValue(raw).url
    const html = label ? sanitizeHtml(markdownToHtml(label)) : ''
    return serializeRichTextValue({ source: label, html })
  }

  if (fromType === 'richtext' && toType === 'image') {
    const source = parseRichTextValue(raw).source
    return serializeImageValue({
      url: looksLikeUrl(source) ? source.trim() : '',
      alt: looksLikeUrl(source) ? '' : source,
    })
  }

  if (fromType === 'image' && toType === 'richtext') {
    const image = parseImageValue(raw)
    const source = image.alt || image.url
    const html = source ? sanitizeHtml(markdownToHtml(source)) : ''
    return serializeRichTextValue({ source, html })
  }

  if (fromType === 'link' && toType === 'image') {
    const link = parseLinkValue(raw)
    return serializeImageValue({
      url: link.url,
      alt: link.label,
    })
  }

  if (fromType === 'image' && toType === 'link') {
    const image = parseImageValue(raw)
    return serializeLinkValue({
      url: image.url,
      label: image.alt || image.url,
      target: '_self',
    })
  }

  if (toType === 'plain_text') {
    return raw
  }

  return defaultValueForLeafType(toType, raw)
}

/**
 * Returns a default serialized value for a leaf type, optionally seeded from raw text.
 */
function defaultValueForLeafType(
  type: FieldType,
  seed?: string,
): string | null {
  switch (type) {
    case 'plain_text':
      return seed ?? ''
    case 'link':
      return serializeLinkValue({
        url: seed ?? '',
        label: seed ?? '',
        target: '_self',
      })
    case 'richtext': {
      const source = seed ?? ''
      const html = source ? sanitizeHtml(markdownToHtml(source)) : ''
      return serializeRichTextValue({ source, html })
    }
    case 'image':
      return serializeImageValue({
        url: seed && looksLikeUrl(seed) ? seed.trim() : '',
        alt: seed && !looksLikeUrl(seed) ? seed : '',
      })
    default:
      return null
  }
}

/**
 * Returns true when a type change between structural and leaf types is allowed.
 */
export function canMigrateFieldType(
  fromType: FieldType,
  toType: FieldType,
  hasChildren: boolean,
): boolean {
  if (fromType === toType) return true

  if (hasChildren) return false

  if (
    fromType === 'section' ||
    fromType === 'array' ||
    toType === 'section' ||
    toType === 'array'
  ) {
    return false
  }

  return isLeafFieldType(fromType) && isLeafFieldType(toType)
}
