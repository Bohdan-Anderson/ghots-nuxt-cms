import { describe, expect, it } from 'vitest'
import { normalizeSlug, slugify } from './slug'

describe('normalizeSlug', () => {
  it('returns root for empty input', () => {
    expect(normalizeSlug('')).toBe('/')
  })
})

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('about us')).toBe('/about-us')
  })

  it('removes non url-safe characters', () => {
    expect(slugify('Hello, World!')).toBe('/hello-world')
  })

  it('preserves leading slash', () => {
    expect(slugify('/About Us')).toBe('/about-us')
  })

  it('handles nested paths', () => {
    expect(slugify('/blog/My Post Title')).toBe('/blog/my-post-title')
  })

  it('returns empty for whitespace only', () => {
    expect(slugify('   ')).toBe('')
  })

  it('returns root for lone slash', () => {
    expect(slugify('/')).toBe('/')
  })

  it('collapses consecutive hyphens', () => {
    expect(slugify('a---b')).toBe('/a-b')
  })

  it('returns empty when input has no url-safe characters', () => {
    expect(slugify('!!!')).toBe('')
  })
})
