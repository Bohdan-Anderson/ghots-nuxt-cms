import { describe, expect, it } from 'vitest'
import type { PageContent } from '../types/cms'
import {
  canSyncManifestEntry,
  resolveManifestFieldType,
} from './resolveManifestFieldType'

function content(overrides?: Partial<PageContent['template']>): PageContent {
  return {
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
      field_schema: [{ name: 'title', type: 'plain_text' }],
      ...overrides,
    },
    slices: [],
    fields: [],
    pageFields: [],
    fieldsBySliceId: {},
    fieldsById: {},
    fieldsByName: {},
  }
}

describe('resolveManifestFieldType', () => {
  it('uses declared data-type first', () => {
    const type = resolveManifestFieldType(
      {
        name: 'subtitle',
        declaredType: 'richtext',
        sortOrder: 0,
      },
      content(),
    )
    expect(type).toBe('richtext')
  })

  it('falls back to slice registry for slice fields', () => {
    const type = resolveManifestFieldType(
      {
        name: 'headline',
        sliceId: 'slice-1',
        sliceTypeKey: 'hero',
        sortOrder: 0,
      },
      content(),
    )
    expect(type).toBe('plain_text')
  })
})

describe('canSyncManifestEntry', () => {
  it('allows new page fields when data-type is declared', () => {
    expect(
      canSyncManifestEntry(
        {
          name: 'subtitle',
          declaredType: 'plain_text',
          sortOrder: 0,
        },
        content(),
      ),
    ).toBe(true)
  })

  it('skips ambiguous slice fields not in registry without data-type', () => {
    expect(
      canSyncManifestEntry(
        {
          name: 'name',
          sliceId: 'slice-1',
          sliceTypeKey: 'team',
          sortOrder: 0,
        },
        content(),
      ),
    ).toBe(false)
  })
})
