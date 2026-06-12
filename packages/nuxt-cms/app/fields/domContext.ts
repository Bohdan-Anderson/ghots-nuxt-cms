import type { FieldKind, FieldParentContext, FieldRow } from '~/types/cms'
import { parentNameKey } from '~/fields/maps'

const STRUCTURAL_DOM_TYPES = new Set(['page', 'section', 'array'])
const EDITABLE_DOM_TYPES = new Set([
  'plain_text',
  'richtext',
  'link',
  'image',
])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Lookup maps used to resolve DOM names to field rows. */
export interface FieldRegistry {
  fieldsById: Record<string, FieldRow>
  fieldsByParentAndName: Record<string, FieldRow>
}

/** Resolved binding for a DOM field element. */
export interface FieldBinding {
  name: string
  parentId: string | null
  context: FieldParentContext
  field: FieldRow | null
}

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
 * Returns true when a string is a valid field row uuid.
 */
export function isValidFieldId(id: string | undefined): boolean {
  const trimmed = id?.trim()
  return !!trimmed && UUID_RE.test(trimmed)
}

/**
 * Resolves page/global scope for a DOM element.
 */
export function resolveFieldScope(element: HTMLElement): FieldParentContext {
  const globalEl = element.closest('[data-global]') as HTMLElement | null
  if (globalEl) {
    return {
      pageId: null,
      globalId: globalEl.dataset.id?.trim() ?? null,
      parentId: null,
    }
  }

  const pageEl = element.closest('[data-type="page"]') as HTMLElement | null
  return {
    pageId: pageEl?.dataset.id?.trim() ?? null,
    globalId: null,
    parentId: null,
  }
}

/**
 * Resolves the array field id that owns an array item section in the DOM.
 */
function resolveArrayItemParentId(
  itemElement: HTMLElement,
  registry: FieldRegistry,
): string | null {
  const hostSection = itemElement.parentElement?.closest(
    '[data-type="section"][data-name]:not([data-name^="item_"])',
  ) as HTMLElement | null
  if (!hostSection) return null

  const hostId = resolveFieldIdForContainer(hostSection, registry)
  if (!hostId) return null

  const arrayField = Object.values(registry.fieldsById).find(
    (field) => field.parent_id === hostId && field.kind === 'array',
  )

  return arrayField?.id ?? null
}

/**
 * Resolves a section/array container element to its field row id.
 */
function resolveFieldIdForContainer(
  container: HTMLElement,
  registry: FieldRegistry,
): string | null {
  const dataId = container.dataset.id?.trim()
  if (dataId && registry.fieldsById[dataId]) {
    return dataId
  }

  const name = container.dataset.name?.trim()
  if (!name) return null

  const containerParentId = resolveParentFieldId(container, registry)
  const key = parentNameKey(containerParentId, name)
  return registry.fieldsByParentAndName[key]?.id ?? null
}

/**
 * Resolves the parent field row id for a DOM element (its `parent_id` in DB).
 */
export function resolveParentFieldId(
  element: HTMLElement,
  registry: FieldRegistry,
): string | null {
  if (element.closest('[data-global]') && !element.dataset.global) {
    return null
  }

  const domType = parseDomType(element.dataset.type)
  const name = element.dataset.name?.trim()

  if (domType === 'section' && name?.startsWith('item_')) {
    return resolveArrayItemParentId(element, registry)
  }

  let current: HTMLElement | null = element.parentElement

  while (current) {
    if (current.dataset.global) return null

    const parentDomType = parseDomType(current.dataset.type)

    if (parentDomType === 'section' || parentDomType === 'array') {
      const parentName = current.dataset.name?.trim()
      if (parentName) {
        return resolveFieldIdForContainer(current, registry)
      }
    }

    if (parentDomType === 'page') break
    current = current.parentElement
  }

  return null
}

/**
 * Resolves a field binding from a DOM element and the current field registry.
 */
export function resolveFieldBinding(
  element: HTMLElement,
  registry: FieldRegistry,
): FieldBinding | null {
  if (element.dataset.global) return null

  const name = element.dataset.name?.trim()
  if (!name) return null

  const dataId = element.dataset.id?.trim()
  if (dataId && registry.fieldsById[dataId]) {
    const field = registry.fieldsById[dataId]!
    return {
      name: field.name,
      parentId: field.parent_id,
      context: {
        ...resolveFieldScope(element),
        parentId: field.parent_id,
      },
      field,
    }
  }

  const parentId = resolveParentFieldId(element, registry)
  const context: FieldParentContext = {
    ...resolveFieldScope(element),
    parentId,
  }
  const field = registry.fieldsByParentAndName[parentNameKey(parentId, name)] ?? null

  return { name, parentId, context, field }
}

/**
 * Computes DOM depth for shallowest-first ensure ordering.
 */
export function computeDomDepth(element: HTMLElement): number {
  let depth = 0
  let current: HTMLElement | null = element.parentElement

  while (current) {
    if (current.dataset.global) break

    const domType = parseDomType(current.dataset.type)
    if (
      current.hasAttribute('data-name') &&
      (domType === 'section' || domType === 'array')
    ) {
      depth++
    }

    if (domType === 'page') break
    current = current.parentElement
  }

  return depth
}

/**
 * Finds the nearest named element (self or ancestor).
 */
export function closestNamedElement(
  element: HTMLElement,
): HTMLElement | null {
  return element.closest('[data-name]') as HTMLElement | null
}
