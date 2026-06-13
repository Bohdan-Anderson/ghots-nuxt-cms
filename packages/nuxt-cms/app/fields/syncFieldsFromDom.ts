import type { FieldRow, PageContent } from '~/types/cms'
import { buildFieldMaps } from '~/fields/maps'
import { ensureField, type EnsureFieldInput } from '~/fields/ensureField'
import {
  computeDomDepth,
  resolveFieldBinding,
  type FieldRegistry,
} from '~/fields/domContext'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Collects CMS DOM nodes that still need a field row, shallowest first.
 */
export function collectUnresolvedNodes(
  root: HTMLElement,
  registry: FieldRegistry,
): HTMLElement[] {
  const nodes: HTMLElement[] = []

  for (const node of root.querySelectorAll('[data-name]')) {
    const element = node as HTMLElement
    if (element.dataset.global) continue

    const id = element.dataset.id?.trim()
    if (id && registry.fieldsById[id]) continue

    nodes.push(element)
  }

  return nodes.sort((a, b) => {
    const depthDiff = computeDomDepth(a) - computeDomDepth(b)
    if (depthDiff !== 0) return depthDiff
    if (a === b) return 0
    const position = a.compareDocumentPosition(b)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })
}

/**
 * Assigns sort_order from sibling index among unresolved nodes with the same parent.
 */
function assignSortOrders(
  elements: HTMLElement[],
  registry: FieldRegistry,
): Map<HTMLElement, number> {
  const counters = new Map<string, number>()
  const result = new Map<HTMLElement, number>()

  for (const element of elements) {
    const binding = resolveFieldBinding(element, registry)
    if (!binding) continue

    const key = binding.parentId ?? 'root'
    const order = counters.get(key) ?? 0
    counters.set(key, order + 1)
    result.set(element, order)
  }

  return result
}

/**
 * Builds ensure input from a DOM element and resolved binding.
 */
export function buildEnsureInput(
  element: HTMLElement,
  binding: NonNullable<ReturnType<typeof resolveFieldBinding>>,
  sortOrder: number,
): EnsureFieldInput {
  return {
    name: binding.name,
    parentId: binding.parentId,
    context: binding.context,
    domType: element.dataset.type ?? null,
    sortOrder,
    element,
  }
}

/**
 * Ensures all DOM-declared fields exist in Supabase for logged-in editors.
 * Processes shallowest missing nodes first in a single pass.
 */
export async function syncFieldsFromDom(
  supabase: SupabaseClient,
  content: PageContent,
  root: HTMLElement,
): Promise<FieldRow[]> {
  const fields = [...content.fields]
  const changed: FieldRow[] = []
  const changedIds = new Set<string>()

  let registry = buildFieldMaps(fields)
  const unresolved = collectUnresolvedNodes(root, registry)
  if (unresolved.length === 0) return []

  const sortOrders = assignSortOrders(unresolved, registry)

  for (const element of unresolved) {
    registry = buildFieldMaps(fields)
    const binding = resolveFieldBinding(element, registry)
    if (!binding || binding.field) continue

    const beforeIds = new Set(fields.map((row) => row.id))
    const result = await ensureField(
      supabase,
      content,
      buildEnsureInput(element, binding, sortOrders.get(element) ?? 0),
      fields,
    )

    if (!result) continue

    const existingIndex = fields.findIndex((row) => row.id === result.id)
    if (existingIndex >= 0) {
      fields[existingIndex] = result
    } else {
      fields.push(result)
    }

    if (!beforeIds.has(result.id) && !changedIds.has(result.id)) {
      changed.push(result)
      changedIds.add(result.id)
    }
  }

  return changed
}
