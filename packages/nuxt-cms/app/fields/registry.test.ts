import { describe, expect, it } from 'vitest'
import {
  fieldTypeSupportsOnPageClick,
  getFieldTypeConfig,
  previewFieldValue,
} from './registry'
import { serializeLinkValue, serializeRichTextValue } from '~/types/fieldValues'

describe('getFieldTypeConfig', () => {
  it('returns config for each editable column type', () => {
    expect(getFieldTypeConfig('plain_text')?.column).toBe('plain_text')
    expect(getFieldTypeConfig('link')?.column).toBe('link')
    expect(getFieldTypeConfig('richtext')?.column).toBe('richtext')
    expect(getFieldTypeConfig('image')?.column).toBe('image')
  })
})

describe('fieldTypeSupportsOnPageClick', () => {
  it('is true for all v3 editable DOM types', () => {
    expect(fieldTypeSupportsOnPageClick('plain_text')).toBe(true)
    expect(fieldTypeSupportsOnPageClick('link')).toBe(true)
    expect(fieldTypeSupportsOnPageClick('richtext')).toBe(true)
    expect(fieldTypeSupportsOnPageClick('image')).toBe(true)
  })
})

describe('previewFieldValue', () => {
  it('shows empty placeholders', () => {
    expect(previewFieldValue('plain_text', null)).toBe('(empty)')
    expect(previewFieldValue('link', null)).toBe('(empty link)')
    expect(previewFieldValue('image', null)).toBe('(no image)')
  })

  it('truncates long plain_text previews', () => {
    const long = 'a'.repeat(50)
    expect(previewFieldValue('plain_text', long)).toBe(`${'a'.repeat(40)}…`)
  })

  it('prefers link label over url in preview', () => {
    const value = serializeLinkValue({
      url: 'https://example.com',
      label: 'Learn more',
      target: '_self',
    })
    expect(previewFieldValue('link', value)).toBe('Learn more')
  })

  it('flattens richtext source for sidebar preview', () => {
    const value = serializeRichTextValue({
      source: 'Hello\n\n**world**',
      html: '<p>Hello</p><p><strong>world</strong></p>',
    })
    expect(previewFieldValue('richtext', value)).toBe('Hello **world**')
  })
})

describe('draft round-trip', () => {
  it('serializes link drafts from JSON editor state', () => {
    const config = getFieldTypeConfig('link')!
    const draft = JSON.stringify({
      url: 'https://example.com',
      label: 'Go',
      target: '_self',
    })
    const stored = config.draftToValue(draft)
    expect(parseLinkFromStored(stored)).toEqual({
      url: 'https://example.com',
      label: 'Go',
      target: '_self',
    })
  })

  it('serializes richtext drafts with list markdown to stored html', () => {
    const config = getFieldTypeConfig('richtext')!
    const draft = '- Alpha\n- Beta\n\n1. One\n2. Two'
    const stored = config.draftToValue(draft)
    const parsed = JSON.parse(stored) as { source: string; html: string }

    expect(parsed.source).toBe(draft)
    expect(parsed.html).toBe(
      '<ul><li>Alpha</li><li>Beta</li></ul><ol><li>One</li><li>Two</li></ol>',
    )
  })
})

function parseLinkFromStored(value: string) {
  return JSON.parse(value) as {
    url: string
    label: string
    target: string
  }
}
