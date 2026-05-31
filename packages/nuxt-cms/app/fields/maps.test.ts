import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import {
  collectFieldSubtree,
  collectFieldSubtreeIds,
} from './maps'

function field(
  partial: Partial<FieldRow> & Pick<FieldRow, 'id' | 'name' | 'type'>,
): FieldRow {
  return {
    page_id: 'page-1',
    slice_id: null,
    global_id: null,
    parent_id: null,
    value: null,
    sort_order: 0,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

describe('collectFieldSubtreeIds', () => {
  it('includes direct child descendants', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', type: 'section' }),
      field({ id: 'child', name: 'name', type: 'plain_text', parent_id: 'root' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect(ids.has('root')).toBe(true)
    expect(ids.has('child')).toBe(true)
  })

  it('includes deeply nested descendants', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', type: 'section' }),
      field({ id: 'section', name: 'details', type: 'section', parent_id: 'root' }),
      field({ id: 'leaf', name: 'bio', type: 'plain_text', parent_id: 'section' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect([...ids].sort()).toEqual(['leaf', 'root', 'section'])
  })

  it('does not include siblings or unrelated branches', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', type: 'section' }),
      field({ id: 'child', name: 'name', type: 'plain_text', parent_id: 'root' }),
      field({ id: 'other-root', name: 'item_1', type: 'section' }),
      field({ id: 'other-child', name: 'name', type: 'plain_text', parent_id: 'other-root' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect(ids.has('other-root')).toBe(false)
    expect(ids.has('other-child')).toBe(false)
  })
})

describe('collectFieldSubtree', () => {
  it('returns rows matching cascade delete scope', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', type: 'section' }),
      field({ id: 'section', name: 'details', type: 'section', parent_id: 'root' }),
      field({ id: 'leaf', name: 'bio', type: 'plain_text', parent_id: 'section' }),
      field({ id: 'sibling', name: 'item_1', type: 'section' }),
    ]
    const subtree = collectFieldSubtree(fields, 'root')
    expect(subtree.map((row) => row.id).sort()).toEqual(['leaf', 'root', 'section'])
  })
})
