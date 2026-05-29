/**
 * Structured field value shapes stored as JSON in `fields.value`.
 */

export interface LinkValue {
  url: string
  label: string
  target: '_self' | '_blank'
}

export interface RichTextValue {
  /** Markdown source edited in the modal. */
  source: string
  /** Sanitized HTML rendered in templates (`v-html`). */
  html: string
}

const EMPTY_LINK: LinkValue = { url: '', label: '', target: '_self' }

const EMPTY_RICHTEXT: RichTextValue = { source: '', html: '' }

/**
 * Parses a link field value from the database.
 */
export function parseLinkValue(value: string | null): LinkValue {
  if (!value) return { ...EMPTY_LINK }
  try {
    const parsed = JSON.parse(value) as Partial<LinkValue>
    return {
      url: typeof parsed.url === 'string' ? parsed.url : '',
      label: typeof parsed.label === 'string' ? parsed.label : '',
      target: parsed.target === '_blank' ? '_blank' : '_self',
    }
  } catch {
    return { ...EMPTY_LINK }
  }
}

/**
 * Serializes a link value for storage in `fields.value`.
 */
export function serializeLinkValue(link: LinkValue): string {
  return JSON.stringify({
    url: link.url.trim(),
    label: link.label.trim(),
    target: link.target === '_blank' ? '_blank' : '_self',
  })
}

/**
 * Parses a richtext field value from the database.
 */
export function parseRichTextValue(value: string | null): RichTextValue {
  if (!value) return { ...EMPTY_RICHTEXT }
  try {
    const parsed = JSON.parse(value) as Partial<RichTextValue>
    return {
      source: typeof parsed.source === 'string' ? parsed.source : '',
      html: typeof parsed.html === 'string' ? parsed.html : '',
    }
  } catch {
    return { ...EMPTY_RICHTEXT }
  }
}

/**
 * Serializes richtext source + sanitized HTML for storage.
 */
export function serializeRichTextValue(richtext: RichTextValue): string {
  return JSON.stringify({
    source: richtext.source,
    html: richtext.html,
  })
}
