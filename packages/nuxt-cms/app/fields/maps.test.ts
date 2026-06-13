import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { collectFieldSubtree, collectFieldSubtreeIds } from './maps'

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

describe('collectFieldSubtreeIds', () => {
  it('includes direct child descendants', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', kind: 'section' }),
      field({ id: 'child', name: 'name', parent_id: 'root', plain_text: 'x' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect(ids.has('root')).toBe(true)
    expect(ids.has('child')).toBe(true)
  })

  it('includes deeply nested descendants', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', kind: 'section' }),
      field({
        id: 'section',
        name: 'details',
        kind: 'section',
        parent_id: 'root',
      }),
      field({ id: 'leaf', name: 'bio', parent_id: 'section', plain_text: 'x' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect([...ids].sort()).toEqual(['leaf', 'root', 'section'])
  })
})

describe('collectFieldSubtree', () => {
  it('returns rows matching cascade delete scope', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', kind: 'section' }),
      field({
        id: 'section',
        name: 'details',
        kind: 'section',
        parent_id: 'root',
      }),
      field({ id: 'leaf', name: 'bio', parent_id: 'section', plain_text: 'x' }),
      field({ id: 'sibling', name: 'item_1', kind: 'section' }),
    ]
    const subtree = collectFieldSubtree(fields, 'root')
    expect(subtree.map((row) => row.id).sort()).toEqual([
      'leaf',
      'root',
      'section',
    ])
  })
})
