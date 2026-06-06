import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent, PageSliceRow } from '../types/cms'
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

function slice(
  partial: Partial<PageSliceRow> & Pick<PageSliceRow, 'id' | 'slice_type_key'>,
): PageSliceRow {
  return {
    page_id: 'page-1',
    sort_order: 0,
    ...partial,
  }
}

describe('slice add panel patch', () => {
  const existingSlice = slice({
    id: 'slice-1',
    slice_type_key: 'hero',
    sort_order: 0,
  })

  const existingFields: FieldRow[] = [
    field({
      id: 'headline-1',
      name: 'headline',
      type: 'plain_text',
      slice_id: 'slice-1',
      value: 'Welcome',
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
    slices: [existingSlice],
    fields: existingFields,
    pageFields: [],
    fieldsBySliceId: { 'slice-1': existingFields },
    fieldsById: Object.fromEntries(existingFields.map((row) => [row.id, row])),
    fieldsByName: {},
  }

  it('merges slice and seeded field subtree without refetching the page', () => {
    const newSlice = slice({
      id: 'slice-2',
      slice_type_key: 'hero',
      sort_order: 1,
    })
    const seededFields = [
      field({
        id: 'headline-2',
        name: 'headline',
        type: 'plain_text',
        slice_id: 'slice-2',
        value: '',
        sort_order: 0,
      }),
    ]

    const slices = [...base.slices, newSlice].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
    const patched = rebuildPageContent(base, {
      slices,
      fields: [...base.fields, ...seededFields],
    })

    expect(patched.fields).toHaveLength(2)
    expect(patched.slices).toHaveLength(2)
    expect(patched.fieldsBySliceId['slice-2']).toEqual(seededFields)
    expect(patched.fieldsById['headline-2']?.slice_id).toBe('slice-2')
  })

  it('preserves sort order when appending a new slice', () => {
    const newSlice = slice({
      id: 'slice-2',
      slice_type_key: 'cta',
      sort_order: 1,
    })

    const slices = [...base.slices, newSlice].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
    const patched = rebuildPageContent(base, { slices })

    expect(patched.slices.map((row) => row.id)).toEqual(['slice-1', 'slice-2'])
    expect(patched.slices[1]?.sort_order).toBe(1)
  })
})
