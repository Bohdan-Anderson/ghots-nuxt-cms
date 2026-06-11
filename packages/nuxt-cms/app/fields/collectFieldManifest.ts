import type { RawFieldManifestEntry } from '~/fields/resolveManifestFieldType'
import { parseDeclaredFieldType } from '~/fields/resolveManifestFieldType'

/**
 * Finds the nearest ancestor element carrying a data-name attribute.
 */
function closestNamedAncestor(
  element: HTMLElement,
  excludeSelf = false,
): HTMLElement | null {
  let current: HTMLElement | null = excludeSelf
    ? element.parentElement
    : element

  while (current) {
    if (current.hasAttribute('data-name')) return current
    current = current.parentElement
  }

  return null
}

/**
 * Finds the nearest ancestor section field (data-name + data-type=section).
 */
function closestSectionParentName(element: HTMLElement): string | null {
  let current = element.parentElement

  while (current) {
    if (
      current.hasAttribute('data-name') &&
      current.dataset.type === 'section'
    ) {
      return current.dataset.name ?? null
    }
    current = current.parentElement
  }

  return null
}

/**
 * Reads slice context from the nearest slice wrapper element.
 */
function sliceContext(element: HTMLElement): {
  sliceId: string | null
  sliceTypeKey: string | null
} {
  const sliceEl = element.closest('[data-slice-id]') as HTMLElement | null
  return {
    sliceId: sliceEl?.dataset.sliceId ?? null,
    sliceTypeKey: sliceEl?.dataset.sliceType ?? null,
  }
}

/**
 * Assigns sort_order from sibling index among manifest entries with the same parent.
 */
function assignSortOrders(entries: RawFieldManifestEntry[]): RawFieldManifestEntry[] {
  const counters = new Map<string, number>()

  return entries.map((entry) => {
    const key = [
      entry.sliceId ?? 'page',
      entry.parentName ?? '',
    ].join(':')
    const order = counters.get(key) ?? 0
    counters.set(key, order + 1)
    return { ...entry, sortOrder: order }
  })
}

/**
 * Walks the rendered page DOM and collects field declarations from [data-name] elements.
 */
export function collectFieldManifest(root: HTMLElement): RawFieldManifestEntry[] {
  const elements = root.querySelectorAll('[data-name]')
  const entries: RawFieldManifestEntry[] = []
  const seen = new Set<string>()

  for (const node of elements) {
    const element = node as HTMLElement
    const name = element.dataset.name?.trim()
    if (!name) continue

    const { sliceId, sliceTypeKey } = sliceContext(element)
    const parentName = closestSectionParentName(element)
    const dedupeKey = [
      sliceId ?? 'page',
      parentName ?? '',
      name,
    ].join(':')

    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    entries.push({
      name,
      declaredType: parseDeclaredFieldType(element.dataset.type),
      sliceId,
      sliceTypeKey,
      parentName,
      sortOrder: 0,
    })
  }

  return assignSortOrders(entries)
}

/**
 * Builds a manifest entry from a single clicked [data-name] element.
 */
export function manifestEntryFromElement(
  element: HTMLElement,
): RawFieldManifestEntry | null {
  const named = closestNamedAncestor(element, false)
  if (!named?.dataset.name) return null

  const { sliceId, sliceTypeKey } = sliceContext(named)
  const parentName = closestSectionParentName(named)

  return {
    name: named.dataset.name,
    declaredType: parseDeclaredFieldType(named.dataset.type),
    sliceId,
    sliceTypeKey,
    parentName,
    sortOrder: 0,
  }
}
