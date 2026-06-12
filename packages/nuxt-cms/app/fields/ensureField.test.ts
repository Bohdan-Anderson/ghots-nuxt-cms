import { describe, expect, it, vi } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import {
  ensureField,
  ensureInputFromElement,
  fieldHasChildren,
} from './ensureField'

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

function pageContent(fields: FieldRow[]): PageContent {
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
      field_schema: [],
    },
    fields,
    pageFields: fields,
    fieldsById: Object.fromEntries(fields.map((row) => [row.id, row])),
    fieldsByName: Object.fromEntries(
      fields
        .filter((row) => row.parent_id === null)
        .map((row) => [row.name, row]),
    ),
    fieldsByParentAndName: Object.fromEntries(
      fields.map((row) => [`${row.parent_id ?? ''}:${row.name}`, row]),
    ),
  }
}

function createMockSupabase(responses: { insert?: FieldRow[] }) {
  let insertIndex = 0

  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => {
      const inserted = responses.insert?.[insertIndex]
      if (inserted) {
        insertIndex += 1
        return { data: inserted, error: null }
      }
      return { data: null, error: new Error('no mock response') }
    }),
  }

  return {
    from: vi.fn(() => chain),
    chain,
  }
}

describe('ensureField', () => {
  it('inserts a missing root field', async () => {
    const inserted = field({
      id: 'new-title',
      name: 'title',
      plain_text: null,
    })
    const supabase = createMockSupabase({ insert: [inserted] })
    const content = pageContent([])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'title',
        parentId: null,
        context: { pageId: 'page-1', globalId: null, parentId: null },
        domType: 'plain_text',
        sortOrder: 0,
      },
      content.fields,
    )

    expect(result?.id).toBe('new-title')
    expect(supabase.from).toHaveBeenCalledWith('fields')
  })

  it('returns existing field without insert', async () => {
    const existing = field({ id: 'title-id', name: 'title', plain_text: 'Hi' })
    const supabase = createMockSupabase({})
    const content = pageContent([existing])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'title',
        parentId: null,
        context: { pageId: 'page-1', globalId: null, parentId: null },
        domType: 'plain_text',
        sortOrder: 0,
      },
      content.fields,
    )

    expect(result?.id).toBe('title-id')
    expect(supabase.chain.insert).not.toHaveBeenCalled()
  })

  it('inserts global-scoped fields with global_id set', async () => {
    const inserted = field({
      id: 'nav-id',
      name: 'nav_label',
      global_id: 'global-1',
      page_id: null,
      plain_text: null,
    })
    const supabase = createMockSupabase({ insert: [inserted] })
    const content = pageContent([])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'nav_label',
        parentId: null,
        context: { pageId: null, globalId: 'global-1', parentId: null },
        domType: 'plain_text',
      },
      content.fields,
    )

    expect(result?.global_id).toBe('global-1')
    expect(result?.page_id).toBeNull()
    expect(supabase.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        global_id: 'global-1',
        page_id: null,
        kind: null,
      }),
    )
  })

  it('sets kind for structural DOM types', async () => {
    const inserted = field({
      id: 'section-id',
      name: 'hero1',
      kind: 'section',
    })
    const supabase = createMockSupabase({ insert: [inserted] })
    const content = pageContent([])

    await ensureField(
      supabase as never,
      content,
      {
        name: 'hero1',
        parentId: null,
        context: { pageId: 'page-1', globalId: null, parentId: null },
        domType: 'section',
      },
      content.fields,
    )

    expect(supabase.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'section' }),
    )
  })
})

describe('ensureInputFromElement', () => {
  it('returns null when data-name is missing', () => {
    const element = document.createElement('p')
    element.dataset.type = 'plain_text'

    expect(
      ensureInputFromElement(element, {
        pageId: 'page-1',
        globalId: null,
        parentId: null,
      }),
    ).toBeNull()
  })

  it('captures name, parent, and DOM type', () => {
    const element = document.createElement('h2')
    element.dataset.name = 'headline'
    element.dataset.type = 'plain_text'

    expect(
      ensureInputFromElement(
        element,
        { pageId: 'page-1', globalId: null, parentId: 'hero1-id' },
        2,
      ),
    ).toEqual({
      name: 'headline',
      parentId: 'hero1-id',
      context: { pageId: 'page-1', globalId: null, parentId: 'hero1-id' },
      domType: 'plain_text',
      sortOrder: 2,
    })
  })
})

describe('fieldHasChildren', () => {
  it('detects child rows in the flat field list', () => {
    const fields = [
      field({ id: 'hero', name: 'hero1', kind: 'section' }),
      field({ id: 'hl', name: 'headline', parent_id: 'hero' }),
    ]

    expect(fieldHasChildren('hero', fields)).toBe(true)
    expect(fieldHasChildren('hl', fields)).toBe(false)
  })
})
