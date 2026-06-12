import { describe, expect, it } from 'vitest'
import type { FieldRow } from '../types/cms'
import { parentNameKey } from './maps'
import {
  computeDomDepth,
  domTypeToKind,
  isEditableDomType,
  isStructuralDomType,
  parseDomType,
  closestNamedElement,
  resolveFieldBinding,
  resolveFieldScope,
  resolveParentFieldId,
  type FieldRegistry,
} from './domContext'

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

function registry(fields: FieldRow[]): FieldRegistry {
  return {
    fieldsById: Object.fromEntries(fields.map((row) => [row.id, row])),
    fieldsByParentAndName: Object.fromEntries(
      fields.map((row) => [parentNameKey(row.parent_id, row.name), row]),
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

const sharedFields: FieldRow[] = [
  field({ id: 'hero1-id', name: 'hero1', kind: 'section' }),
  field({
    id: 'headline1-id',
    name: 'headline',
    parent_id: 'hero1-id',
    plain_text: 'One',
  }),
  field({ id: 'hero2-id', name: 'hero2', kind: 'section' }),
  field({
    id: 'headline2-id',
    name: 'headline',
    parent_id: 'hero2-id',
    plain_text: 'Two',
  }),
  field({ id: 'team-id', name: 'team', kind: 'section' }),
  field({ id: 'members-id', name: 'members', parent_id: 'team-id', kind: 'array' }),
  field({
    id: 'item-0-id',
    name: 'item_0',
    parent_id: 'members-id',
    kind: 'section',
  }),
  field({
    id: 'name-id',
    name: 'name',
    parent_id: 'item-0-id',
    plain_text: 'Alex',
  }),
]

describe('parseDomType', () => {
  it('trims whitespace', () => {
    expect(parseDomType('  plain_text  ')).toBe('plain_text')
  })

  it('returns null for empty values', () => {
    expect(parseDomType('')).toBeNull()
    expect(parseDomType(undefined)).toBeNull()
  })
})

describe('dom type helpers', () => {
  it('classifies structural and editable DOM types', () => {
    expect(isStructuralDomType('section')).toBe(true)
    expect(isStructuralDomType('plain_text')).toBe(false)
    expect(isEditableDomType('richtext')).toBe(true)
    expect(isEditableDomType('array')).toBe(false)
  })

  it('maps structural DOM types to DB kind', () => {
    expect(domTypeToKind('section')).toBe('section')
    expect(domTypeToKind('array')).toBe('array')
    expect(domTypeToKind('plain_text')).toBeNull()
  })
})

describe('resolveFieldBinding', () => {
  it('resolves section parent when section has data-id', () => {
    const headline = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
      'data-id': 'hero1-id',
    }, [headline])
    const page = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [section])
    document.body.appendChild(page)

    expect(resolveFieldBinding(headline, registry(sharedFields))).toMatchObject({
      name: 'headline',
      parentId: 'hero1-id',
      context: { pageId: 'page-1', globalId: null, parentId: 'hero1-id' },
      field: sharedFields[1],
    })

    page.remove()
  })

  it('resolves parent from registry when section lacks data-id', () => {
    const headline = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headline])
    const page = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [section])
    document.body.appendChild(page)

    expect(resolveFieldBinding(headline, registry(sharedFields))?.parentId).toBe(
      'hero1-id',
    )

    page.remove()
  })

  it('short-circuits on data-global wrapper', () => {
    const label = el('strong', {
      'data-name': 'nav_label',
      'data-type': 'plain_text',
    })
    const nav = el('nav', {
      'data-global': 'site',
      'data-id': 'global-1',
    }, [label])
    document.body.appendChild(nav)

    expect(resolveFieldScope(label)).toEqual({
      pageId: null,
      globalId: 'global-1',
      parentId: null,
    })
    expect(resolveFieldBinding(label, registry([]))).toMatchObject({
      name: 'nav_label',
      parentId: null,
      context: { pageId: null, globalId: 'global-1', parentId: null },
    })

    nav.remove()
  })

  it('uses section parent when nested under array hook', () => {
    const name = el('p', { 'data-name': 'name', 'data-type': 'plain_text' })
    const item = el('li', {
      'data-name': 'item_0',
      'data-type': 'section',
      'data-id': 'item-0-id',
    }, [name])
    const members = el('div', {
      'data-name': 'members',
      'data-type': 'array',
      'data-id': 'members-id',
    })
    const team = el('section', {
      'data-name': 'team',
      'data-type': 'section',
      'data-id': 'team-id',
    }, [members, item])
    document.body.appendChild(team)

    expect(resolveFieldBinding(name, registry(sharedFields))?.parentId).toBe(
      'item-0-id',
    )

    team.remove()
  })
})

describe('resolveParentFieldId', () => {
  const reg = registry(sharedFields)

  it('resolves section parent from registry when DOM section has no data-id', () => {
    const headline = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headline])
    document.body.appendChild(section)

    expect(resolveParentFieldId(headline, reg)).toBe('hero1-id')

    section.remove()
  })

  it('distinguishes duplicate field names under different sections', () => {
    const headline1 = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const hero1 = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
      'data-id': 'hero1-id',
    }, [headline1])

    const headline2 = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const hero2 = el('section', {
      'data-name': 'hero2',
      'data-type': 'section',
      'data-id': 'hero2-id',
    }, [headline2])

    document.body.append(hero1, hero2)

    expect(resolveParentFieldId(headline1, reg)).toBe('hero1-id')
    expect(resolveParentFieldId(headline2, reg)).toBe('hero2-id')

    hero1.remove()
    hero2.remove()
  })

  it('resolves array item section parent to the members array field', () => {
    const item = el('li', {
      'data-name': 'item_0',
      'data-type': 'section',
    })
    const list = el('ul', {}, [item])
    const team = el('section', {
      'data-name': 'team',
      'data-type': 'section',
      'data-id': 'team-id',
    }, [list])
    document.body.appendChild(team)

    expect(resolveParentFieldId(item, reg)).toBe('members-id')

    team.remove()
  })

  it('resolves leaf field parent to array item section', () => {
    const name = el('p', {
      'data-name': 'name',
      'data-type': 'plain_text',
    })
    const item = el('li', {
      'data-name': 'item_0',
      'data-type': 'section',
      'data-id': 'item-0-id',
    }, [name])
    document.body.appendChild(item)

    expect(resolveParentFieldId(name, reg)).toBe('item-0-id')

    item.remove()
  })
})

describe('computeDomDepth', () => {
  it('orders section before nested leaf', () => {
    const headline = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
    }, [headline])
    const page = el('article', {
      'data-type': 'page',
      'data-id': 'page-1',
    }, [section])
    document.body.appendChild(page)

    expect(computeDomDepth(section)).toBeLessThan(computeDomDepth(headline))

    page.remove()
  })
})

describe('closestNamedElement', () => {
  it('returns the element itself when it has data-name', () => {
    const target = el('span', { 'data-name': 'label' })
    expect(closestNamedElement(target)).toBe(target)
  })

  it('walks up to the nearest named ancestor', () => {
    const inner = el('em', {})
    const named = el('p', { 'data-name': 'copy' }, [inner])
    expect(closestNamedElement(inner)).toBe(named)
  })
})
