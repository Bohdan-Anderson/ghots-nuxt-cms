import { describe, expect, it, vi } from 'vitest'
import type { FieldRow, PageContent } from '../types/cms'
import {
  collectEnsureInputs,
  sortEnsureInputs,
  syncFieldsFromDom,
} from './syncFieldsFromDom'

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
      slug: '/demo',
      template_id: 'tpl-1',
      title: 'Demo',
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
      key: 'sections-demo',
      label: 'Sections demo',
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

function el(
  tag: string,
  attrs: Record<string, string>,
  children: HTMLElement[] = [],
): HTMLElement {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value)
  }
  for (const child of children) {
    node.appendChild(child)
  }
  return node
}

function createMockSupabase(inserts: FieldRow[]) {
  let index = 0

  const chain = {
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => {
      const row = inserts[index]
      if (!row) {
        return { data: null, error: new Error('no mock insert') }
      }
      index += 1
      return { data: row, error: null }
    }),
  }

  return {
    from: vi.fn(() => chain),
    chain,
  }
}

describe('collectEnsureInputs', () => {
  it('dedupes entries with the same parent and name', () => {
    const duplicate = el('p', {
      'data-name': 'title',
      'data-type': 'plain_text',
    })
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [duplicate, duplicate.cloneNode(true) as HTMLElement])

    const inputs = collectEnsureInputs(root, [])
    expect(inputs.filter((row) => row.name === 'title')).toHaveLength(1)
  })

  it('assigns parent id from DB when section lacks data-id', () => {
    const fields = [
      field({ id: 'hero1-id', name: 'hero1', kind: 'section' }),
    ]
    const headline = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headline])
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [section])

    const inputs = collectEnsureInputs(root, fields)
    const headlineInput = inputs.find((row) => row.name === 'headline')

    expect(headlineInput?.parentId).toBe('hero1-id')
  })
})

describe('sortEnsureInputs', () => {
  it('orders structural containers before leaf fields', () => {
    const sorted = sortEnsureInputs([
      {
        name: 'headline',
        parentId: 'hero1-id',
        context: { pageId: 'page-1', globalId: null, parentId: 'hero1-id' },
        domType: 'plain_text',
        sortOrder: 1,
      },
      {
        name: 'hero1',
        parentId: null,
        context: { pageId: 'page-1', globalId: null, parentId: null },
        domType: 'section',
        sortOrder: 0,
      },
    ])

    expect(sorted.map((row) => row.name)).toEqual(['hero1', 'headline'])
  })
})

describe('syncFieldsFromDom', () => {
  it('creates section then nested headline across passes when section has no data-id', async () => {
    const heroSection = field({ id: 'hero1-id', name: 'hero1', kind: 'section' })
    const headline = field({
      id: 'headline-id',
      name: 'headline',
      parent_id: 'hero1-id',
      plain_text: null,
    })

    const supabase = createMockSupabase([heroSection, headline])
    const content = pageContent([])

    const headlineEl = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const sectionEl = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headlineEl])
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [sectionEl])

    const changed = await syncFieldsFromDom(supabase as never, content, root)

    expect(changed.map((row) => row.name)).toEqual(['hero1', 'headline'])
    expect(changed[1]?.parent_id).toBe('hero1-id')
    expect(supabase.chain.insert).toHaveBeenCalledTimes(2)
  })

  it('defers nested fields until parent section exists in the field list', async () => {
    const heroSection = field({ id: 'hero1-id', name: 'hero1', kind: 'section' })
    const headline = field({
      id: 'headline-id',
      name: 'headline',
      parent_id: 'hero1-id',
    })

    const supabase = createMockSupabase([headline])
    const content = pageContent([heroSection])

    const headlineEl = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const sectionEl = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headlineEl])
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [sectionEl])

    const changed = await syncFieldsFromDom(supabase as never, content, root)

    expect(changed).toHaveLength(1)
    expect(changed[0]?.name).toBe('headline')
    expect(changed[0]?.parent_id).toBe('hero1-id')
    expect(supabase.chain.insert).toHaveBeenCalledTimes(1)
  })

  it('creates distinct headline rows under each hero section', async () => {
    const hero1 = field({ id: 'h1', name: 'hero1', kind: 'section' })
    const headline1 = field({
      id: 'hl1',
      name: 'headline',
      parent_id: 'h1',
    })
    const hero2 = field({ id: 'h2', name: 'hero2', kind: 'section' })
    const headline2 = field({
      id: 'hl2',
      name: 'headline',
      parent_id: 'h2',
    })
    const supabase = createMockSupabase([hero1, headline1, hero2, headline2])
    const content = pageContent([])

    const buildHero = (name: string) => {
      const headlineEl = el('h2', {
        'data-name': 'headline',
        'data-type': 'plain_text',
      })
      return el('section', {
        'data-name': name,
        'data-type': 'section',
      }, [headlineEl])
    }

    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [buildHero('hero1'), buildHero('hero2')])

    const changed = await syncFieldsFromDom(supabase as never, content, root)
    const headlines = changed.filter((row) => row.name === 'headline')

    expect(headlines).toHaveLength(2)
    expect(new Set(headlines.map((row) => row.parent_id))).toEqual(
      new Set(['h1', 'h2']),
    )
  })

  it('returns only newly inserted rows', async () => {
    const existing = field({ id: 'title-id', name: 'title', plain_text: 'Hi' })
    const supabase = createMockSupabase([])
    const content = pageContent([existing])

    const title = el('h1', {
      'data-name': 'title',
      'data-type': 'plain_text',
      'data-id': 'title-id',
    })
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [title])

    const changed = await syncFieldsFromDom(supabase as never, content, root)

    expect(changed).toEqual([])
    expect(supabase.chain.insert).not.toHaveBeenCalled()
  })

  it('assigns global scope for fields inside data-global regions', () => {
    const navLabel = el('strong', {
      'data-name': 'nav_label',
      'data-type': 'plain_text',
    })
    const nav = el('nav', { 'data-global': 'site', 'data-id': 'global-1' }, [
      navLabel,
    ])
    const root = el('div', {}, [nav])

    const inputs = collectEnsureInputs(root, [])
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toMatchObject({
      name: 'nav_label',
      parentId: null,
      context: {
        pageId: null,
        globalId: 'global-1',
        parentId: null,
      },
    })
  })

  it('assigns sort_order among siblings with the same parent', () => {
    const title = el('h1', { 'data-name': 'title', 'data-type': 'plain_text' })
    const subtitle = el('p', {
      'data-name': 'subtitle',
      'data-type': 'plain_text',
    })
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [title, subtitle])

    const inputs = collectEnsureInputs(root, [])
    expect(inputs.find((row) => row.name === 'title')?.sortOrder).toBe(0)
    expect(inputs.find((row) => row.name === 'subtitle')?.sortOrder).toBe(1)
  })
})
