import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import {
  emptyFieldRow,
  firstPopulatedColumn,
  getFieldColumnValue,
} from './fieldValues'

function field(
  partial: Partial<FieldRow> & Pick<FieldRow, 'id' | 'name'>,
): FieldRow {
  return {
    page_id: 'page-1',
    global_id: null,
    parent_id: null,
    kind: null,
    plain_text: null,
    richtext: null,
    link: null,
    image: null,
    sort_order: 0,
    ...partial,
  }
}

describe('getFieldColumnValue', () => {
  it('reads typed columns from a field row', () => {
    const row = field({
      id: '1',
      name: 'title',
      plain_text: 'Hello',
      link: '{"url":"/","label":"Home","target":"_self"}',
    })

    expect(getFieldColumnValue(row, 'plain_text')).toBe('Hello')
    expect(getFieldColumnValue(row, 'image')).toBeNull()
  })
})

describe('firstPopulatedColumn', () => {
  it('returns the first non-empty value column', () => {
    expect(
      firstPopulatedColumn(
        field({
          id: '1',
          name: 'x',
          richtext: '{"source":"a","html":"<p>a</p>"}',
        }),
      ),
    ).toBe('richtext')
  })

  it('returns null when all columns are empty', () => {
    expect(firstPopulatedColumn(field({ id: '1', name: 'x' }))).toBeNull()
  })

  it('prefers plain_text over later columns when multiple are set', () => {
    const row = field({
      id: '1',
      name: 'x',
      plain_text: 'Title',
      link: '{"url":"/","label":"Go","target":"_self"}',
    })

    expect(firstPopulatedColumn(row)).toBe('plain_text')
  })

  it('treats empty strings as unpopulated', () => {
    const row = field({
      id: '1',
      name: 'x',
      plain_text: '',
      image: '{"url":"/img.png","alt":"x"}',
    })

    expect(firstPopulatedColumn(row)).toBe('image')
  })
})

describe('emptyFieldRow', () => {
  it('provides a guest-safe placeholder before ensure runs', () => {
    const placeholder = emptyFieldRow('headline', 'parent-1')

    expect(placeholder).toMatchObject({
      id: '',
      name: 'headline',
      parent_id: 'parent-1',
      plain_text: null,
    })
  })
})
