import type { FieldKind, FieldParentContext } from '~/types/cms'

const STRUCTURAL_DOM_TYPES = new Set(['page', 'section', 'array'])
const EDITABLE_DOM_TYPES = new Set([
  'plain_text',
  'richtext',
  'link',
  'image',
])

/**
 * Parses a data-type attribute into a known DOM type string.
 */
export function parseDomType(value: string | undefined): string | null {
  if (!value?.trim()) return null
  return value.trim()
}

/**
 * Returns true when the DOM type is a structural container.
 */
export function isStructuralDomType(domType: string | null): boolean {
  return domType != null && STRUCTURAL_DOM_TYPES.has(domType)
}

/**
 * Returns true when the DOM type maps to an editable value column.
 */
export function isEditableDomType(
  domType: string | null,
): domType is 'plain_text' | 'richtext' | 'link' | 'image' {
  return domType != null && EDITABLE_DOM_TYPES.has(domType)
}

/**
 * Maps a structural DOM type to a DB kind.
 */
export function domTypeToKind(domType: string | null): FieldKind | null {
  if (domType === 'section' || domType === 'array') return domType
  return null
}

/**
 * Walks DOM ancestors to resolve page/global scope and parent field id.
 */
export function resolveFieldParentContext(
  element: HTMLElement,
): FieldParentContext {
  let pageId: string | null = null
  let globalId: string | null = null
  let parentId: string | null = null

  let current: HTMLElement | null = element

  while (current) {
    const globalKey = current.dataset.global
    if (globalKey) {
      return {
        pageId: null,
        globalId: current.dataset.id ?? null,
        parentId: null,
      }
    }

    const domType = parseDomType(current.dataset.type)

    if (domType === 'section' && current.dataset.id) {
      parentId = current.dataset.id
      break
    }

    if (domType === 'page' && current.dataset.id) {
      pageId = current.dataset.id
      parentId = null
      break
    }

    current = current.parentElement
  }

  if (!pageId && !globalId) {
    const pageEl = element.closest(
      '[data-type="page"]',
    ) as HTMLElement | null
    pageId = pageEl?.dataset.id ?? null
  }

  return { pageId, globalId, parentId }
}

/**
 * Finds the nearest named element (self or ancestor).
 */
export function closestNamedElement(
  element: HTMLElement,
): HTMLElement | null {
  return element.closest('[data-name]') as HTMLElement | null
}
