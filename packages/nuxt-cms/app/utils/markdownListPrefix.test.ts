import { describe, expect, it } from 'vitest'
import {
  applyMarkdownListPrefix,
  applyOrderedListPrefix,
  applyUnorderedListPrefix,
} from './markdownListPrefix'

describe('applyUnorderedListPrefix', () => {
  it('prefixes a single line at the caret', () => {
    const result = applyUnorderedListPrefix({
      value: 'Hello',
      selectionStart: 5,
      selectionEnd: 5,
    })

    expect(result).toEqual({
      value: '- Hello',
      selectionStart: 7,
      selectionEnd: 7,
    })
  })

  it('prefixes each line in a multi-line selection', () => {
    const result = applyUnorderedListPrefix({
      value: 'One\nTwo\nThree',
      selectionStart: 0,
      selectionEnd: 13,
    })

    expect(result).toEqual({
      value: '- One\n- Two\n- Three',
      selectionStart: 0,
      selectionEnd: 19,
    })
  })

  it('only affects lines spanned by the selection', () => {
    const result = applyUnorderedListPrefix({
      value: 'Before\nMiddle\nAfter',
      selectionStart: 7,
      selectionEnd: 13,
    })

    expect(result).toEqual({
      value: 'Before\n- Middle\nAfter',
      selectionStart: 7,
      selectionEnd: 15,
    })
  })

  it('converts ordered markers to bullets', () => {
    const result = applyUnorderedListPrefix({
      value: '1. First\n2. Second',
      selectionStart: 0,
      selectionEnd: 16,
    })

    expect(result.value).toBe('- First\n- Second')
  })

  it('leaves blank lines unchanged inside the block', () => {
    const result = applyUnorderedListPrefix({
      value: 'One\n\nTwo',
      selectionStart: 0,
      selectionEnd: 7,
    })

    expect(result.value).toBe('- One\n\n- Two')
  })
})

describe('applyOrderedListPrefix', () => {
  it('numbers each line in the selection', () => {
    const result = applyOrderedListPrefix({
      value: 'Alpha\nBeta',
      selectionStart: 0,
      selectionEnd: 10,
    })

    expect(result.value).toBe('1. Alpha\n2. Beta')
  })

  it('converts bullet markers to ordered items', () => {
    const result = applyOrderedListPrefix({
      value: '- First\n- Second',
      selectionStart: 0,
      selectionEnd: 16,
    })

    expect(result.value).toBe('1. First\n2. Second')
  })
})

describe('applyMarkdownListPrefix', () => {
  it('preserves text before and after the affected block', () => {
    const result = applyMarkdownListPrefix(
      {
        value: 'Intro\nLine one\nLine two\nOutro',
        selectionStart: 6,
        selectionEnd: 21,
      },
      (index) => `${index + 1}. `,
    )

    expect(result.value).toBe('Intro\n1. Line one\n2. Line two\nOutro')
  })
})
