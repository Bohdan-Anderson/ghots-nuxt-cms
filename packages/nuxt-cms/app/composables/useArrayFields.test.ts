import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import { collectFieldSubtreeIds } from '../fields/maps'
import { rebuildPageContent } from '../fields/pageContent'

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

describe('array item panel patch', () => {
  const baseFields: FieldRow[] = [
    field({ id: 'arr', name: 'posts', type: 'array' }),
    field({ id: 'item-0', name: 'item_0', type: 'section', parent_id: 'arr' }),
    field({
      id: 'title-0',
      name: 'title',
      type: 'plain_text',
      parent_id: 'item-0',
      value: 'First',
    }),
  ]

  const base: PageContent = {
    page: {
      id: 'page-1',
      slug: '/',
      template_id: 'tpl-1',
      title: 'Home',
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
    fields: baseFields,
    pageFields: baseFields,
    fieldsBySliceId: {},
    fieldsById: Object.fromEntries(baseFields.map((row) => [row.id, row])),
    fieldsByName: { posts: baseFields[0]! },
  }

  it('merges seeded subtree rows without refetching the page', () => {
    const newSubtree = [
      field({ id: 'item-1', name: 'item_1', type: 'section', parent_id: 'arr', sort_order: 1 }),
      field({
        id: 'title-1',
        name: 'title',
        type: 'plain_text',
        parent_id: 'item-1',
        value: 'Second',
        sort_order: 0,
      }),
    ]

    const patched = rebuildPageContent(base, {
      fields: [...base.fields, ...newSubtree],
    })

    expect(patched.fields).toHaveLength(5)
    expect(patched.fieldsById['title-1']?.value).toBe('Second')
  })

  it('removes an item subtree from panel state after cascade delete', () => {
    const removeIds = collectFieldSubtreeIds(base.fields, 'item-0')
    const patched = rebuildPageContent(base, {
      fields: base.fields.filter((row) => !removeIds.has(row.id)),
    })

    expect(patched.fields.map((row) => row.id)).toEqual(['arr'])
  })
})
