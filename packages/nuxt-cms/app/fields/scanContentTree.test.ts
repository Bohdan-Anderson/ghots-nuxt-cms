import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import {
  enrichTreeWithFields,
  flattenContentTree,
  scanContentTree,
} from './scanContentTree'

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

function buildDemoPageDom(): HTMLElement {
  const hero1Headline = el('h2', {
    'data-name': 'headline',
    'data-type': 'plain_text',
    'data-id': 'h1',
  })
  const hero1 = el('section', {
    'data-name': 'hero1',
    'data-type': 'section',
    'data-id': 'hero1-id',
  }, [hero1Headline])

  const hero2Headline = el('h2', {
    'data-name': 'headline',
    'data-type': 'plain_text',
    'data-id': 'h2',
  })
  const hero2 = el('section', {
    'data-name': 'hero2',
    'data-type': 'section',
    'data-id': 'hero2-id',
  }, [hero2Headline])

  const title = el('h1', {
    'data-name': 'title',
    'data-type': 'plain_text',
    'data-id': 'title-id',
  })

  return el('article', {
    'data-type': 'page',
    'data-id': 'page-1',
  }, [title, hero1, hero2])
}

function wrapPage(article: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.appendChild(article)
  return wrapper
}

describe('scanContentTree', () => {
  it('nests hero headlines under their sections without merging siblings', () => {
    const wrapper = wrapPage(buildDemoPageDom())
    document.body.appendChild(wrapper)

    const tree = scanContentTree(wrapper)
    const flat = flattenContentTree(tree)

    expect(flat.find((node) => node.name === 'page')).toBeDefined()
    expect(flat.filter((node) => node.name === 'hero1')).toHaveLength(1)
    expect(flat.filter((node) => node.name === 'hero2')).toHaveLength(1)

    const hero1 = flat.find((node) => node.name === 'hero1')
    const hero2 = flat.find((node) => node.name === 'hero2')
    expect(hero1?.children.map((node) => node.name)).toEqual(['headline'])
    expect(hero2?.children.map((node) => node.name)).toEqual(['headline'])
    expect(hero1?.children[0]).toMatchObject({
      previewColumn: 'plain_text',
      depth: 1,
    })

    wrapper.remove()
  })

  it('includes array hooks in the tree', () => {
    const members = el('div', {
      'data-name': 'members',
      'data-type': 'array',
      'data-id': 'members-id',
    })
    const team = el('section', {
      'data-name': 'team',
      'data-type': 'section',
      'data-id': 'team-id',
    }, [members])
    const page = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [team])
    document.body.appendChild(page)

    const flat = flattenContentTree(scanContentTree(page))
    expect(flat.map((node) => node.name)).toContain('members')
    expect(flat.find((node) => node.name === 'members')).toMatchObject({
      kind: 'array',
      domType: 'array',
    })

    page.remove()
  })

  it('nests array item sections and their leaf fields under the array hook', () => {
    const name = el('p', {
      'data-name': 'name',
      'data-type': 'plain_text',
      'data-id': 'name-id',
    })
    const item = el('li', {
      'data-name': 'item_0',
      'data-type': 'section',
      'data-id': 'item-id',
    }, [name])
    const members = el('div', {
      'data-name': 'members',
      'data-type': 'array',
      'data-id': 'members-id',
    }, [item])
    const team = el('section', {
      'data-name': 'team',
      'data-type': 'section',
      'data-id': 'team-id',
    }, [members])
    const page = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [team])
    document.body.appendChild(page)

    const flat = flattenContentTree(scanContentTree(page))
    const membersNode = flat.find((node) => node.name === 'members')
    const itemNode = flat.find((node) => node.name === 'item_0')

    expect(membersNode?.children.map((node) => node.name)).toEqual(['item_0'])
    expect(itemNode?.children.map((node) => node.name)).toEqual(['name'])
    expect(itemNode?.depth).toBe(2)
    expect(flat.find((node) => node.name === 'name')?.depth).toBe(3)

    page.remove()
  })
})

describe('flattenContentTree', () => {
  it('preserves depth-first order for sidebar rendering', () => {
    const flat = flattenContentTree(scanContentTree(wrapPage(buildDemoPageDom())))

    expect(flat.map((node) => `${node.depth}:${node.name}`)).toEqual([
      '0:page',
      '0:title',
      '0:hero1',
      '1:headline',
      '0:hero2',
      '1:headline',
    ])
  })
})

describe('enrichTreeWithFields', () => {
  it('fills preview column from DB when DOM leaf has no preview hint', () => {
    const node = el('span', {
      'data-name': 'copy',
      'data-id': 'copy-id',
    })
    const root = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [node])
    document.body.appendChild(root)

    const scanned = scanContentTree(root)
    const fieldsById = {
      'copy-id': field({
        id: 'copy-id',
        name: 'copy',
        richtext: '{"source":"Hi","html":"<p>Hi</p>"}',
      }),
    }

    const enriched = enrichTreeWithFields(scanned, fieldsById)
    const copyNode = flattenContentTree(enriched).find(
      (row) => row.name === 'copy',
    )

    expect(copyNode?.previewColumn).toBe('richtext')

    root.remove()
  })
})
