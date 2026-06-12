import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { resolveArrayItems, resolveField } from './resolveField'

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

describe('resolveField', () => {
  const pageFields: FieldRow[] = [
    field({ id: '1', name: 'title', plain_text: 'Home' }),
    field({ id: '2', name: 'main', kind: 'section' }),
    field({
      id: '3',
      name: 'body',
      parent_id: '2',
      plain_text: 'Body text',
    }),
  ]

  it('resolves a root page field', () => {
    expect(resolveField(pageFields, 'title')?.plain_text).toBe('Home')
  })

  it('resolves a field inside a section by parent id', () => {
    expect(resolveField(pageFields, 'body', '2')?.plain_text).toBe('Body text')
  })
})

describe('resolveArrayItems', () => {
  const fields: FieldRow[] = [
    field({ id: 'arr', name: 'members', kind: 'array' }),
    field({
      id: 'item-0',
      name: 'item_0',
      kind: 'section',
      parent_id: 'arr',
      sort_order: 0,
    }),
    field({
      id: 'name-0',
      name: 'name',
      parent_id: 'item-0',
      plain_text: 'Alex',
    }),
  ]

  it('returns ordered item field groups', () => {
    const items = resolveArrayItems(fields, 'arr')
    expect(items).toHaveLength(1)
    expect(items[0]?.find((row) => row.name === 'name')?.plain_text).toBe('Alex')
  })
})
