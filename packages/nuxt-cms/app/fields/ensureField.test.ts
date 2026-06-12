import { describe, expect, it, vi } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import { ensureField } from './ensureField'

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
})
