import { describe, expect, it } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import {
  buildPageContentPayload,
  patchFieldInContent,
  rebuildPageContent,
} from './pageContent'

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
  fields: [field({ id: '1', name: 'title', plain_text: 'A' })],
  pageFields: [],
  fieldsById: {},
  fieldsByName: {},
  fieldsByParentAndName: {},
}

describe('rebuildPageContent', () => {
  it('rebuilds maps when fields change', () => {
    const nextFields = [
      ...base.fields,
      field({ id: '2', name: 'intro', plain_text: 'B' }),
    ]
    const rebuilt = rebuildPageContent(base, { fields: nextFields })
    expect(rebuilt.fields).toHaveLength(2)
    expect(rebuilt.fieldsById['2']?.name).toBe('intro')
    expect(rebuilt.pageFields).toHaveLength(2)
    expect(rebuilt.fieldsByParentAndName[':intro']?.plain_text).toBe('B')
  })
})

describe('patchFieldInContent', () => {
  it('delegates to rebuildPageContent for an updated field', () => {
    const updated = field({
      id: '1',
      name: 'title',
      plain_text: 'Updated',
    })
    const patched = patchFieldInContent(base, updated)
    const rebuilt = rebuildPageContent(base, {
      fields: base.fields.map((row) => (row.id === '1' ? updated : row)),
    })

    expect(patched.fieldsById['1']?.plain_text).toBe('Updated')
    expect(patched).toEqual(rebuilt)
  })

  it('appends a field that was not in the list', () => {
    const added = field({ id: '2', name: 'intro', plain_text: 'B' })
    const patched = patchFieldInContent(base, added)
    expect(patched.fields).toHaveLength(2)
    expect(patched.fieldsById['2']?.name).toBe('intro')
  })
})

describe('buildPageContentPayload', () => {
  it('builds derived maps from a flat field list', () => {
    const fields = [
      field({ id: '1', name: 'title', plain_text: 'Home' }),
      field({
        id: '2',
        name: 'headline',
        plain_text: 'Hero',
        parent_id: 'section-1',
      }),
    ]
    const payload = buildPageContentPayload(
      {
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
      {
        id: 'tpl-1',
        site_id: 'site-1',
        key: 'default',
        label: 'Default',
        field_schema: [],
      },
      fields,
    )

    expect(payload.fieldsByName.title?.plain_text).toBe('Home')
    expect(
      payload.fieldsByParentAndName['section-1:headline']?.plain_text,
    ).toBe('Hero')
  })
})
