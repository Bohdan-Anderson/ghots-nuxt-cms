import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { cmsColumnValue, useCmsField } from './useCmsField'

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

describe('useCmsField', () => {
  it('resolves an existing field by parent and name', () => {
    const map = {
      ':title': field({ id: 'title-id', name: 'title', plain_text: 'Home' }),
      'hero1-id:headline': field({
        id: 'headline-id',
        name: 'headline',
        parent_id: 'hero1-id',
        plain_text: 'Hi',
      }),
    }

    expect(useCmsField(map, 'hero1-id', 'headline').id).toBe('headline-id')
  })

  it('returns an empty placeholder when the row does not exist yet', () => {
    const map = {}

    const placeholder = useCmsField(map, 'hero1-id', 'headline')

    expect(placeholder.id).toBe('')
    expect(placeholder.name).toBe('headline')
    expect(placeholder.parent_id).toBe('hero1-id')
  })
})

describe('cmsColumnValue', () => {
  it('returns empty string for missing column values', () => {
    const row = field({ id: '1', name: 'title' })
    expect(cmsColumnValue(row, 'plain_text')).toBe('')
  })
})
