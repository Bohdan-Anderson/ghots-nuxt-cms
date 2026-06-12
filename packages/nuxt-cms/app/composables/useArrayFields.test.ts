import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import { countArrayItems } from './useArrayFields'
import { collectFieldSubtreeIds } from '../fields/maps'
import { rebuildPageContent } from '../fields/pageContent'

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

describe('countArrayItems', () => {
  it('counts only section children under the array field', () => {
    const fields = [
      field({ id: 'arr', name: 'members', kind: 'array' }),
      field({
        id: 'item-0',
        name: 'item_0',
        kind: 'section',
        parent_id: 'arr',
      }),
      field({
        id: 'item-1',
        name: 'item_1',
        kind: 'section',
        parent_id: 'arr',
      }),
      field({
        id: 'name-0',
        name: 'name',
        parent_id: 'item-0',
      }),
    ]

    expect(countArrayItems(fields, 'arr')).toBe(2)
  })
})

describe('array item panel patch', () => {
  const baseFields: FieldRow[] = [
    field({ id: 'arr', name: 'posts', kind: 'array' }),
    field({ id: 'item-0', name: 'item_0', kind: 'section', parent_id: 'arr' }),
    field({
      id: 'title-0',
      name: 'title',
      parent_id: 'item-0',
      plain_text: 'First',
    }),
  ]

  const base: PageContent = {
    page: {
      id: 'page-1',
      site_id: 'site-1',
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
      site_id: 'site-1',
      key: 'default',
      label: 'Default',
      field_schema: [],
    },
    fields: baseFields,
    pageFields: baseFields,
    fieldsById: Object.fromEntries(baseFields.map((row) => [row.id, row])),
    fieldsByName: { posts: baseFields[0]! },
    fieldsByParentAndName: Object.fromEntries(
      baseFields.map((row) => [`${row.parent_id ?? ''}:${row.name}`, row]),
    ),
  }

  it('merges seeded subtree rows without refetching the page', () => {
    const newSubtree = [
      field({
        id: 'item-1',
        name: 'item_1',
        kind: 'section',
        parent_id: 'arr',
        sort_order: 1,
      }),
      field({
        id: 'title-1',
        name: 'title',
        parent_id: 'item-1',
        plain_text: 'Second',
        sort_order: 0,
      }),
    ]

    const patched = rebuildPageContent(base, {
      fields: [...base.fields, ...newSubtree],
    })

    expect(patched.fields).toHaveLength(5)
    expect(patched.fieldsById['title-1']?.plain_text).toBe('Second')
  })

  it('removes an item subtree from panel state after cascade delete', () => {
    const removeIds = collectFieldSubtreeIds(base.fields, 'item-0')
    const patched = rebuildPageContent(base, {
      fields: base.fields.filter((row) => !removeIds.has(row.id)),
    })

    expect(patched.fields.map((row) => row.id)).toEqual(['arr'])
  })
})
