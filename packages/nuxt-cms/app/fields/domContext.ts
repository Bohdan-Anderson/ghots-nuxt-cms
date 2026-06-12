import type { FieldKind, FieldParentContext, FieldRow } from '~/types/cms'

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
 * Resolves the array field id that owns an array item section in the DOM.
 */
function resolveArrayContainerParentId(
  itemElement: HTMLElement,
  fields: FieldRow[],
): string | null {
  const hostSection = itemElement.parentElement?.closest(
    '[data-type="section"][data-name]:not([data-name^="item_"])',
  ) as HTMLElement | null
  if (!hostSection) return null

  const hostName = hostSection.dataset.name?.trim()
  if (!hostName) return null

  const hostId =
    hostSection.dataset.id?.trim()
    ?? fields.find(
      (field) =>
        field.name === hostName
        && field.parent_id === null
        && field.kind === 'section',
    )?.id

  if (!hostId) return null

  const arrayField = fields.find(
    (field) => field.parent_id === hostId && field.kind === 'array',
  )

  return arrayField?.id ?? null
}

/**
 * Resolves a section/array parent id from DB when the DOM ancestor has no data-id yet.
 */
export function resolveParentIdFromFields(
  element: HTMLElement,
  fields: FieldRow[],
): string | null {
  const domType = parseDomType(element.dataset.type)
  const elementName = element.dataset.name?.trim()

  if (domType === 'section' && elementName?.startsWith('item_')) {
    return resolveArrayContainerParentId(element, fields)
  }

  const itemSection = element.closest(
    '[data-type="section"][data-name^="item_"]',
  ) as HTMLElement | null

  if (itemSection && itemSection !== element) {
    const itemId = itemSection.dataset.id?.trim()
    if (itemId) return itemId

    const itemName = itemSection.dataset.name?.trim()
    if (itemName) {
      const itemRow = fields.find(
        (field) => field.name === itemName && field.kind === 'section',
      )
      if (itemRow) return itemRow.id
    }
  }

  let current: HTMLElement | null = element.parentElement

  while (current) {
    const domType = parseDomType(current.dataset.type)

    if (domType === 'section' || domType === 'array') {
      const dataId = current.dataset.id?.trim()
      if (dataId) return dataId

      const name = current.dataset.name?.trim()
      if (name) {
        const containerParentId = resolveParentIdFromFields(current, fields)
        const match = fields.find(
          (field) =>
            field.name === name
            && field.parent_id === containerParentId
            && (field.kind === 'section' || field.kind === 'array'),
        )
        if (match) return match.id
      }
    }

    if (domType === 'page') return null
    current = current.parentElement
  }

  return null
}

/**
 * Finds the nearest named element (self or ancestor).
 */
export function closestNamedElement(
  element: HTMLElement,
): HTMLElement | null {
  return element.closest('[data-name]') as HTMLElement | null
}
