import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FieldRow } from '../types/cms'
import { updateFieldColumn } from './usePageContent'
import { usePageEditor } from './usePageEditor'

vi.mock('./usePageContent', () => ({
  updateFieldColumn: vi.fn(),
}))

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

describe('usePageEditor', () => {
  beforeEach(() => {
    vi.mocked(updateFieldColumn).mockReset()
  })

  it('merges page and global fields in the click registry', () => {
    const editor = usePageEditor()
    const globalNav = field({
      id: 'global-nav',
      name: 'nav_label',
      global_id: 'global-1',
      page_id: null,
      plain_text: 'Site',
    })
    const pageTitle = field({
      id: 'page-title',
      name: 'title',
      plain_text: 'Home',
    })

    editor.registerFields(
      { [globalNav.id]: globalNav },
      { ':nav_label': globalNav },
    )
    editor.registerFields(
      { [pageTitle.id]: pageTitle },
      { ':title': pageTitle },
    )

    const nav = el('strong', {
      'data-name': 'nav_label',
      'data-type': 'plain_text',
      'data-id': 'global-nav',
    })
    const title = el('h1', {
      'data-name': 'title',
      'data-type': 'plain_text',
      'data-id': 'page-title',
    })

    expect(editor.resolveFieldFromElement(nav)?.id).toBe('global-nav')
    expect(editor.resolveFieldFromElement(title)?.id).toBe('page-title')
  })

  it('resolves nested fields by parent id and name', () => {
    const editor = usePageEditor()
    const hero = field({ id: 'hero1', name: 'hero1', kind: 'section' })
    const headline = field({
      id: 'hl1',
      name: 'headline',
      parent_id: 'hero1',
      plain_text: 'One',
    })

    editor.registerFields(
      { [hero.id]: hero, [headline.id]: headline },
      {
        ':hero1': hero,
        'hero1:headline': headline,
      },
    )

    const headlineEl = el('h2', {
      'data-name': 'headline',
      'data-type': 'plain_text',
    })
    const section = el('section', {
      'data-name': 'hero1',
      'data-type': 'section',
      'data-id': 'hero1',
    }, [headlineEl])

    document.body.appendChild(section)
    expect(editor.resolveFieldFromElement(headlineEl)?.id).toBe('hl1')
    section.remove()
  })

  it('reads editable column type from data-type attribute', () => {
    const editor = usePageEditor()
    const link = el('a', { 'data-name': 'cta', 'data-type': 'link' })
    const unknown = el('span', { 'data-name': 'x', 'data-type': 'section' })

    expect(editor.editableColumnFromElement(link)).toBe('link')
    expect(editor.editableColumnFromElement(unknown)).toBeNull()
  })

  it('opens modal with draft value from the active column', () => {
    const editor = usePageEditor()
    const row = field({
      id: 'title-id',
      name: 'title',
      plain_text: 'Hello',
    })

    editor.open(row, 'plain_text')

    expect(editor.isOpen.value).toBe(true)
    expect(editor.activeField.value?.id).toBe('title-id')
    expect(editor.activeColumn.value).toBe('plain_text')
    expect(editor.draftValue.value).toBe('Hello')
  })

  it('closes the modal and clears active state', () => {
    const editor = usePageEditor()
    const row = field({ id: 'x', name: 'title', plain_text: 'Hi' })

    editor.open(row, 'plain_text')
    editor.close()

    expect(editor.isOpen.value).toBe(false)
    expect(editor.activeField.value).toBeNull()
    expect(editor.activeColumn.value).toBeNull()
    expect(editor.draftValue.value).toBe('')
  })

  it('notifies all handlers registered via addFieldUpdatedHandler on save', async () => {
    const editor = usePageEditor()
    const row = field({ id: 'title-id', name: 'title', plain_text: 'Before' })
    const updated = { ...row, plain_text: 'After' }
    const first = vi.fn()
    const second = vi.fn()

    vi.mocked(updateFieldColumn).mockResolvedValue(updated)

    editor.addFieldUpdatedHandler(first)
    editor.addFieldUpdatedHandler(second)
    editor.open(row, 'plain_text')
    editor.setDraft('After')
    await editor.save()

    expect(updateFieldColumn).toHaveBeenCalledWith(
      'title-id',
      'plain_text',
      'After',
    )
    expect(first).toHaveBeenCalledWith(updated)
    expect(second).toHaveBeenCalledWith(updated)
    expect(editor.isOpen.value).toBe(false)
  })

  it('resolves by data-id without parent context lookup', () => {
    const editor = usePageEditor()
    const row = field({
      id: 'orphan-id',
      name: 'headline',
      parent_id: 'hero1',
      plain_text: 'X',
    })

    editor.registerFields({ [row.id]: row }, {})

    const el = document.createElement('h2')
    el.dataset.id = 'orphan-id'
    el.dataset.name = 'other-name'

    expect(editor.resolveFieldFromElement(el)?.id).toBe('orphan-id')
  })
})
