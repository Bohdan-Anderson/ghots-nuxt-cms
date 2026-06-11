import { describe, expect, it } from 'vitest'
import type { FieldType } from '../types/cms'
import {
  isValueMalformedForType,
  migrateFieldValue,
  repairFieldValueFormat,
} from './migrateFieldValue'
import {
  parseLinkValue,
  parseRichTextValue,
  serializeLinkValue,
  serializeRichTextValue,
} from '../types/fieldValues'

describe('migrateFieldValue', () => {
  it('converts plain_text to richtext preserving source', () => {
    const result = migrateFieldValue('plain_text', 'richtext', 'Hello **world**')
    const parsed = parseRichTextValue(result)
    expect(parsed.source).toBe('Hello **world**')
    expect(parsed.html).toContain('<strong>world</strong>')
  })

  it('converts richtext to plain_text using source', () => {
    const stored = serializeRichTextValue({
      source: 'Line one',
      html: '<p>Line one</p>',
    })
    expect(migrateFieldValue('richtext', 'plain_text', stored)).toBe('Line one')
  })

  it('converts plain_text to link', () => {
    const result = migrateFieldValue('plain_text', 'link', 'https://example.com')
    expect(parseLinkValue(result).url).toBe('https://example.com')
    expect(parseLinkValue(result).label).toBe('https://example.com')
  })

  it('converts link to plain_text using label or url', () => {
    const stored = serializeLinkValue({
      url: 'https://example.com',
      label: 'Example',
      target: '_self',
    })
    expect(migrateFieldValue('link', 'plain_text', stored)).toBe('Example')
  })

  it('repairs malformed link JSON without changing type', () => {
    const result = migrateFieldValue('link', 'link', 'not-json')
    expect(parseLinkValue(result).url).toBe('not-json')
  })

  it('repairs malformed richtext JSON without changing type', () => {
    const result = repairFieldValueFormat('richtext', 'Hello')
    const parsed = parseRichTextValue(result)
    expect(parsed.source).toBe('Hello')
    expect(parsed.html).toContain('Hello')
  })
})

describe('isValueMalformedForType', () => {
  it('detects invalid JSON for structured types', () => {
    expect(isValueMalformedForType('link', 'plain string')).toBe(true)
    expect(isValueMalformedForType('plain_text', 'plain string')).toBe(false)
  })

  it('treats empty values as valid', () => {
    expect(isValueMalformedForType('link' as FieldType, null)).toBe(false)
    expect(isValueMalformedForType('link' as FieldType, '')).toBe(false)
  })
})
