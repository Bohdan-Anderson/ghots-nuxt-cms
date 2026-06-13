import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './markdownToHtml'

describe('markdownToHtml', () => {
  it('returns empty string for blank source', () => {
    expect(markdownToHtml('')).toBe('')
    expect(markdownToHtml('   ')).toBe('')
  })

  it('converts paragraphs with inline formatting', () => {
    expect(markdownToHtml('Hello **world**')).toBe(
      '<p>Hello <strong>world</strong></p>',
    )
    expect(markdownToHtml('One\nTwo')).toBe('<p>One<br>Two</p>')
  })

  it('converts unordered lists', () => {
    expect(markdownToHtml('- first\n- second')).toBe(
      '<ul><li>first</li><li>second</li></ul>',
    )
    expect(markdownToHtml('* one\n* two')).toBe(
      '<ul><li>one</li><li>two</li></ul>',
    )
  })

  it('converts ordered lists', () => {
    expect(markdownToHtml('1. first\n2. second')).toBe(
      '<ol><li>first</li><li>second</li></ol>',
    )
  })

  it('supports inline formatting inside list items', () => {
    expect(markdownToHtml('- **bold** item\n- [link](https://example.com)')).toBe(
      '<ul><li><strong>bold</strong> item</li><li><a href="https://example.com">link</a></li></ul>',
    )
  })

  it('separates list blocks from paragraphs', () => {
    expect(markdownToHtml('- one\n- two\n\nAfter list')).toBe(
      '<ul><li>one</li><li>two</li></ul><p>After list</p>',
    )
  })

  it('renders a single list item', () => {
    expect(markdownToHtml('- only one')).toBe('<ul><li>only one</li></ul>')
    expect(markdownToHtml('1. only one')).toBe('<ol><li>only one</li></ol>')
  })

  it('renders multiple list blocks separated by blank lines', () => {
    expect(markdownToHtml('- a\n- b\n\n1. one\n2. two')).toBe(
      '<ul><li>a</li><li>b</li></ul><ol><li>one</li><li>two</li></ol>',
    )
  })

  it('treats mixed markers in one block as a paragraph', () => {
    expect(markdownToHtml('- bullet\n1. number')).toBe(
      '<p>- bullet<br>1. number</p>',
    )
  })

  it('escapes HTML in list items', () => {
    expect(markdownToHtml('- <script>alert(1)</script>')).toBe(
      '<ul><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul>',
    )
  })

  it('supports italic inside ordered list items', () => {
    expect(markdownToHtml('1. *first*\n2. **second**')).toBe(
      '<ol><li><em>first</em></li><li><strong>second</strong></li></ol>',
    )
  })
})
