import type { FieldType } from '../types/cms'
import {
  serializeImageValue,
  serializeLinkValue,
  serializeRichTextValue,
} from '../types/fieldValues'
import { markdownToHtml } from '../utils/markdownToHtml'
import { sanitizeHtml } from '../utils/sanitizeHtml'

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
