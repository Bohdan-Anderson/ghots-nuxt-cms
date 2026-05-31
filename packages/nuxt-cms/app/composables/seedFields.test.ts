import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent, PageSliceRow } from '../types/cms'
import { collectFieldSubtreeIds, rebuildPageContent } from './seedFields'

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
  it('includes nested descendants', () => {
    const fields = [
      field({ id: 'root', name: 'item_0', type: 'section' }),
      field({ id: 'child', name: 'name', type: 'plain_text', parent_id: 'root' }),
    ]
    const ids = collectFieldSubtreeIds(fields, 'root')
    expect(ids.has('root')).toBe(true)
    expect(ids.has('child')).toBe(true)
  })
})

describe('rebuildPageContent', () => {
  const base: PageContent = {
    page: {
      id: 'page-1',
      slug: '/',
      template_id: 'tpl-1',
      title: 'Old',
      meta_title: null,
      meta_description: null,
      og_image: null,
      noindex: false,
      created_at: '',
      updated_at: '',
    },
    template: {
      id: 'tpl-1',
      key: 'default',
      label: 'Default',
      field_schema: [],
    },
    slices: [],
    fields: [field({ id: '1', name: 'title', type: 'plain_text', value: 'A' })],
    pageFields: [],
    fieldsBySliceId: {},
    fieldsById: {},
    fieldsByName: {},
  }

  it('rebuilds maps when fields change', () => {
    const nextFields = [
      ...base.fields,
      field({ id: '2', name: 'intro', type: 'plain_text', value: 'B' }),
    ]
    const rebuilt = rebuildPageContent(base, { fields: nextFields })
    expect(rebuilt.fields).toHaveLength(2)
    expect(rebuilt.fieldsById['2']?.name).toBe('intro')
    expect(rebuilt.pageFields).toHaveLength(2)
  })

  it('updates slice order', () => {
    const slices: PageSliceRow[] = [
      {
        id: 's1',
        page_id: 'page-1',
        slice_type_key: 'hero',
        sort_order: 1,
        created_at: '',
        updated_at: '',
      },
      {
        id: 's2',
        page_id: 'page-1',
        slice_type_key: 'cta',
        sort_order: 0,
        created_at: '',
        updated_at: '',
      },
    ]
    const rebuilt = rebuildPageContent(
      { ...base, slices },
      {
        slices: [
          { ...slices[1]!, sort_order: 0 },
          { ...slices[0]!, sort_order: 1 },
        ],
      },
    )
    expect(rebuilt.slices.map((slice) => slice.id)).toEqual(['s2', 's1'])
  })
})
