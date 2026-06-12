import { describe, expect, it, vi } from 'vitest'
import type { FieldRow } from '../types/cms'
import { seedArrayItem } from './seedFields'

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

describe('seedArrayItem', () => {
  it('inserts an item section row with the next index name', async () => {
    const arrayField = field({ id: 'arr', name: 'members', kind: 'array' })
    const inserted = field({
      id: 'item-1',
      name: 'item_1',
      kind: 'section',
      parent_id: 'arr',
      sort_order: 1,
    })

    const chain = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: inserted, error: null })),
    }
    const supabase = { from: vi.fn(() => chain) }

    const rows = await seedArrayItem(supabase as never, arrayField, 1)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'item_1',
      kind: 'section',
      parent_id: 'arr',
      sort_order: 1,
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_id: 'arr',
        name: 'item_1',
        kind: 'section',
        sort_order: 1,
      }),
    )
  })
})
