import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { arrayItemLabel, isArrayItemSection } from './schemaLookup'

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

describe('isArrayItemSection', () => {
  const fieldsById = {
    arr: field({ id: 'arr', name: 'members', kind: 'array' }),
    item: field({
      id: 'item',
      name: 'item_0',
      kind: 'section',
      parent_id: 'arr',
    }),
    hero: field({ id: 'hero', name: 'hero1', kind: 'section' }),
    headline: field({
      id: 'headline',
      name: 'headline',
      parent_id: 'hero',
    }),
  }

  it('returns true for section rows under an array parent', () => {
    expect(isArrayItemSection(fieldsById.item!, fieldsById)).toBe(true)
  })

  it('returns false for page sections and leaf fields', () => {
    expect(isArrayItemSection(fieldsById.hero!, fieldsById)).toBe(false)
    expect(isArrayItemSection(fieldsById.headline!, fieldsById)).toBe(false)
  })
})

describe('arrayItemLabel', () => {
  const arrayField = field({ id: 'arr', name: 'members', kind: 'array' })
  const fields: FieldRow[] = [
    arrayField,
    field({
      id: 'item-0',
      name: 'item_0',
      kind: 'section',
      parent_id: 'arr',
      sort_order: 0,
    }),
    field({
      id: 'item-1',
      name: 'item_1',
      kind: 'section',
      parent_id: 'arr',
      sort_order: 1,
    }),
  ]

  it('labels items by sort order (1-based)', () => {
    expect(arrayItemLabel(fields[1]!, arrayField, fields)).toBe('Item 1')
    expect(arrayItemLabel(fields[2]!, arrayField, fields)).toBe('Item 2')
  })

  it('returns a placeholder when the item is not found among siblings', () => {
    const orphan = field({
      id: 'orphan',
      name: 'item_9',
      kind: 'section',
      parent_id: 'arr',
    })
    expect(arrayItemLabel(orphan, arrayField, fields)).toBe('Item ?')
  })
})
