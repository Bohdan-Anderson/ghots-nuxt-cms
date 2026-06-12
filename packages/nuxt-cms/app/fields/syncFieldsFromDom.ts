import type { FieldRow, PageContent } from '~/types/cms'
import {
  ensureField,
  ensureInputFromElement,
  type EnsureFieldInput,
} from '~/fields/ensureField'
import {
  isStructuralDomType,
  parseDomType,
  resolveFieldParentContext,
} from '~/fields/domContext'

type SupabaseClient = ReturnType<typeof useSupabase>

/**
 * Assigns sort_order from sibling index among entries with the same parent.
 */
function assignSortOrders(
  entries: EnsureFieldInput[],
): EnsureFieldInput[] {
  const counters = new Map<string, number>()

  return entries.map((entry) => {
    const key = entry.parentId ?? 'root'
    const order = counters.get(key) ?? 0
    counters.set(key, order + 1)
    return { ...entry, sortOrder: order }
  })
}

/**
 * Collects ensure inputs from all [data-name] elements in the DOM.
 */
export function collectEnsureInputs(root: HTMLElement): EnsureFieldInput[] {
  const elements = root.querySelectorAll('[data-name]')
  const entries: EnsureFieldInput[] = []
  const seen = new Set<string>()

  for (const node of elements) {
    const element = node as HTMLElement
    const context = resolveFieldParentContext(element)
    const input = ensureInputFromElement(element, context)
    if (!input) continue

    const dedupeKey = `${input.parentId ?? 'root'}:${input.name}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    entries.push(input)
  }

  return assignSortOrders(entries)
}

/**
 * Sorts ensure inputs so section/array parents are created before children.
 */
export function sortEnsureInputs(
  entries: EnsureFieldInput[],
): EnsureFieldInput[] {
  return [...entries].sort((a, b) => {
    const aStructural = isStructuralDomType(parseDomType(a.domType ?? undefined))
    const bStructural = isStructuralDomType(parseDomType(b.domType ?? undefined))
    if (aStructural && !bStructural) return -1
    if (bStructural && !aStructural) return 1
    if (a.parentId && !b.parentId) return 1
    if (!a.parentId && b.parentId) return -1
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}

/**
 * Ensures all DOM-declared fields exist in Supabase for logged-in editors.
 */
export async function syncFieldsFromDom(
  supabase: SupabaseClient,
  content: PageContent,
  root: HTMLElement,
): Promise<FieldRow[]> {
  const inputs = sortEnsureInputs(collectEnsureInputs(root))
  if (inputs.length === 0) return []

  const fields = [...content.fields]
  const changed: FieldRow[] = []

  for (const input of inputs) {
    const beforeIds = new Set(fields.map((row) => row.id))

    let parentId = input.parentId
    if (parentId) {
      const parentEl = root.querySelector(
        `[data-id="${parentId}"]`,
      ) as HTMLElement | null
      if (parentEl && !fields.some((f) => f.id === parentId)) {
        const parentContext = resolveFieldParentContext(parentEl)
        const parentInput = ensureInputFromElement(parentEl, parentContext)
        if (parentInput) {
          const parentRow = await ensureField(
            supabase,
            content,
            parentInput,
            fields,
          )
          if (parentRow) {
            const idx = fields.findIndex((f) => f.id === parentRow.id)
            if (idx >= 0) fields[idx] = parentRow
            else fields.push(parentRow)
            parentId = parentRow.id
            if (!beforeIds.has(parentRow.id)) changed.push(parentRow)
          }
        }
      }
    }

    const result = await ensureField(
      supabase,
      content,
      { ...input, parentId },
      fields,
    )

    if (!result) continue

    const existingIndex = fields.findIndex((row) => row.id === result.id)
    if (existingIndex >= 0) {
      fields[existingIndex] = result
    } else {
      fields.push(result)
    }

    if (!beforeIds.has(result.id)) {
      changed.push(result)
    }
  }

  return changed
}
