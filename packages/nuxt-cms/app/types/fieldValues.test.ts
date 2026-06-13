import { describe, expect, it } from 'vitest'
import {
  parseImageValue,
  parseLinkValue,
  parseRichTextValue,
  serializeImageValue,
  serializeLinkValue,
  serializeRichTextValue,
} from './fieldValues'

describe('parseLinkValue', () => {
  it('returns defaults for null and invalid JSON', () => {
    expect(parseLinkValue(null)).toEqual({
      url: '',
      label: '',
      target: '_self',
    })
    expect(parseLinkValue('{bad')).toEqual({
      url: '',
      label: '',
      target: '_self',
    })
  })

  it('normalizes target to _self or _blank', () => {
    expect(
      parseLinkValue(
        JSON.stringify({ url: '/x', label: 'X', target: '_blank' }),
      ).target,
    ).toBe('_blank')
    expect(
      parseLinkValue(JSON.stringify({ url: '/x', label: 'X', target: 'other' }))
        .target,
    ).toBe('_self')
  })
})

describe('serializeLinkValue', () => {
  it('trims url and label', () => {
    const json = serializeLinkValue({
      url: '  https://example.com  ',
      label: '  Example  ',
      target: '_self',
    })
    expect(JSON.parse(json)).toEqual({
      url: 'https://example.com',
      label: 'Example',
      target: '_self',
    })
  })
})

describe('parseRichTextValue', () => {
  it('round-trips source and html', () => {
    const value = { source: '**Hi**', html: '<p><strong>Hi</strong></p>' }
    const serialized = serializeRichTextValue(value)
    expect(parseRichTextValue(serialized)).toEqual(value)
  })
})

describe('parseImageValue', () => {
  it('returns empty image for null', () => {
    expect(parseImageValue(null)).toEqual({ url: '', alt: '' })
  })

  it('serializes trimmed url and alt', () => {
    const json = serializeImageValue({
      url: ' https://cdn.test/a.png ',
      alt: ' Avatar ',
    })
    expect(JSON.parse(json)).toEqual({
      url: 'https://cdn.test/a.png',
      alt: 'Avatar',
    })
  })
})
