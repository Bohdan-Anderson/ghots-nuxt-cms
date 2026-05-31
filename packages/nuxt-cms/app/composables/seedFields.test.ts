import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'

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

describe('seedFields merge behavior', () => {
  it('preserves existing slice fields when page-level seed rows are merged', () => {
    const existingSliceField = field({
      id: 'slice-field',
      name: 'headline',
      type: 'plain_text',
      slice_id: 'slice-1',
      sort_order: 0,
    })
    const seededPageField = field({
      id: 'page-field',
      name: 'title',
      type: 'plain_text',
      sort_order: 1,
    })

    const merged = [existingSliceField, seededPageField].sort(
      (a, b) => a.sort_order - b.sort_order,
    )

    expect(merged).toHaveLength(2)
    expect(merged.some((row) => row.slice_id === 'slice-1')).toBe(true)
    expect(merged.some((row) => row.slice_id === null)).toBe(true)
  })
})
