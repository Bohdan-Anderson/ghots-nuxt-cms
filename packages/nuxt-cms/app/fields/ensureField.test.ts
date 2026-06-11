import { describe, expect, it, vi } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import { ensureField } from './ensureField'

function field(
  partial: Partial<FieldRow> & Pick<FieldRow, 'id' | 'name' | 'type'>,
): FieldRow {
  return {
    page_id: 'page-1',
    slice_id: null,
    global_id: null,
    parent_id: null,
    value: '',
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
      field_schema: [
        { name: 'title', type: 'plain_text' },
        {
          name: 'main',
          type: 'section',
          children: [{ name: 'body', type: 'plain_text' }],
        },
      ],
    },
    slices: [],
    fields,
    pageFields: fields,
    fieldsBySliceId: {},
    fieldsById: Object.fromEntries(fields.map((row) => [row.id, row])),
    fieldsByName: Object.fromEntries(
      fields
        .filter((row) => row.parent_id === null)
        .map((row) => [row.name, row]),
    ),
  }
}

function createMockSupabase(responses: {
  insert?: FieldRow[]
  update?: FieldRow[]
}) {
  let insertIndex = 0
  let updateIndex = 0

  const chain = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => {
      const inserted = responses.insert?.[insertIndex]
      if (inserted) {
        insertIndex += 1
        return { data: inserted, error: null }
      }
      const updated = responses.update?.[updateIndex]
      if (updated) {
        updateIndex += 1
        return { data: updated, error: null }
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
      type: 'plain_text',
      value: '',
    })
    const supabase = createMockSupabase({ insert: [inserted] })
    const content = pageContent([])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'title',
        type: 'plain_text',
        parentName: null,
        sortOrder: 0,
      },
      content.fields,
    )

    expect(result?.id).toBe('new-title')
    expect(supabase.from).toHaveBeenCalledWith('fields')
  })

  it('creates parent section before nested child field', async () => {
    const mainSection = field({
      id: 'main-id',
      name: 'main',
      type: 'section',
      value: null,
    })
    const bodyField = field({
      id: 'body-id',
      name: 'body',
      type: 'plain_text',
      parent_id: 'main-id',
      value: '',
    })
    const supabase = createMockSupabase({
      insert: [mainSection, bodyField],
    })
    const content = pageContent([])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'body',
        type: 'plain_text',
        parentName: 'main',
        sortOrder: 0,
      },
      content.fields,
    )

    expect(result?.id).toBe('body-id')
    expect(supabase.chain.insert).toHaveBeenCalledTimes(2)
  })

  it('migrates leaf type while preserving text content', async () => {
    const existing = field({
      id: 'copy-id',
      name: 'subtitle',
      type: 'plain_text',
      value: 'Hello',
    })
    const updated = field({
      ...existing,
      type: 'richtext',
      value: '{"source":"Hello","html":"<p>Hello</p>"}',
    })
    const supabase = createMockSupabase({ update: [updated] })
    const content = pageContent([existing])

    const result = await ensureField(
      supabase as never,
      content,
      {
        name: 'subtitle',
        type: 'richtext',
        parentName: null,
        sortOrder: 0,
      },
      content.fields,
    )

    expect(result?.type).toBe('richtext')
    expect(result?.value).toContain('Hello')
  })
})
