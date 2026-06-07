import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent, PageSliceRow } from '../types/cms'
import {
  buildPageContentPayload,
  patchFieldInContent,
  rebuildPageContent,
} from './pageContent'

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

const base: PageContent = {
  page: {
    id: 'page-1',
    site_id: 'site-1',
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
    site_id: 'site-1',
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

describe('rebuildPageContent', () => {
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

describe('patchFieldInContent', () => {
  it('delegates to rebuildPageContent for an updated field', () => {
    const updated = field({
      id: '1',
      name: 'title',
      type: 'plain_text',
      value: 'Updated',
    })
    const patched = patchFieldInContent(base, updated)
    const rebuilt = rebuildPageContent(base, {
      fields: base.fields.map((row) => (row.id === '1' ? updated : row)),
    })

    expect(patched.fieldsById['1']?.value).toBe('Updated')
    expect(patched).toEqual(rebuilt)
  })

  it('appends a field that was not in the list', () => {
    const added = field({ id: '2', name: 'intro', type: 'plain_text', value: 'B' })
    const patched = patchFieldInContent(base, added)
    expect(patched.fields).toHaveLength(2)
    expect(patched.fieldsById['2']?.name).toBe('intro')
  })
})

describe('buildPageContentPayload', () => {
  it('builds derived maps from a flat field list', () => {
    const fields = [
      field({ id: '1', name: 'title', type: 'plain_text', value: 'Home' }),
      field({
        id: '2',
        name: 'headline',
        type: 'plain_text',
        slice_id: 'slice-1',
        value: 'Hero',
      }),
    ]
    const payload = buildPageContentPayload(
      {
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
      {
        id: 'tpl-1',
        key: 'default',
        label: 'Default',
        field_schema: [],
      },
      [],
      fields,
    )

    expect(payload.fieldsByName.title?.value).toBe('Home')
    expect(payload.fieldsBySliceId['slice-1']).toHaveLength(1)
  })
})
