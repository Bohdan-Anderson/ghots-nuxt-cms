import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { resolveArrayItems, resolveField } from './resolveField'

function field(
  partial: Partial<FieldRow> & Pick<FieldRow, 'id' | 'name' | 'type'>,
): FieldRow {
  return {
    page_id: 'page-1',
    slice_id: null,
    global_id: null,
    parent_id: null,
    value: '',
    sort_order: 0,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

describe('resolveField', () => {
  const pageFields: FieldRow[] = [
    field({ id: '1', name: 'title', type: 'plain_text', value: 'Home' }),
    field({ id: '2', name: 'main', type: 'section' }),
    field({
      id: '3',
      name: 'body',
      type: 'plain_text',
      parent_id: '2',
      value: 'Body text',
    }),
    field({
      id: '4',
      name: 'headline',
      type: 'plain_text',
      slice_id: 'slice-a',
      value: 'Hero',
    }),
  ]

  it('resolves a root page field', () => {
    expect(resolveField(pageFields, 'title')?.value).toBe('Home')
  })

  it('resolves a field inside a section', () => {
    expect(resolveField(pageFields, 'body', 'main')?.value).toBe('Body text')
  })

  it('scopes slice fields by slice id', () => {
    expect(resolveField(pageFields, 'headline', undefined, 'slice-a')?.value).toBe(
      'Hero',
    )
    expect(resolveField(pageFields, 'headline', undefined, 'slice-b')).toBeUndefined()
  })
})

describe('resolveArrayItems', () => {
  const fields: FieldRow[] = [
    field({ id: 'arr', name: 'members', type: 'array', slice_id: 'slice-1' }),
    field({
      id: 'item-0',
      name: 'item_0',
      type: 'section',
      parent_id: 'arr',
      slice_id: 'slice-1',
      sort_order: 0,
    }),
    field({
      id: 'name-0',
      name: 'name',
      type: 'plain_text',
      parent_id: 'item-0',
      slice_id: 'slice-1',
      value: 'Alex',
    }),
  ]

  it('returns ordered item field groups', () => {
    const items = resolveArrayItems(fields, 'members', 'slice-1')
    expect(items).toHaveLength(1)
    expect(items[0]?.find((row) => row.name === 'name')?.value).toBe('Alex')
  })
})
