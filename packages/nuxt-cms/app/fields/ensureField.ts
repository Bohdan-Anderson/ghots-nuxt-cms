import type { FieldParentContext, FieldRow, PageContent } from '~/types/cms'
import { domTypeToKind, parseDomType } from '~/fields/domContext'
import { parentNameKey } from '~/fields/maps'
import { resolveFieldByParent } from '~/fields/resolveField'

type SupabaseClient = ReturnType<typeof useSupabase>

export interface EnsureFieldInput {
  name: string
  parentId: string | null
  context: FieldParentContext
  domType?: string | null
  sortOrder?: number
}

/**
 * Returns true when a field row has child rows in the flat list.
 */
export function fieldHasChildren(
  fieldId: string,
  fields: FieldRow[],
): boolean {
  return fields.some((row) => row.parent_id === fieldId)
}

/**
 * Inserts or returns an existing field row for the given parent + name.
 */
export async function ensureField(
  supabase: SupabaseClient,
  content: PageContent,
  input: EnsureFieldInput,
  fields: FieldRow[],
): Promise<FieldRow | null> {
  const existing = resolveFieldByParent(
    Object.fromEntries(
      fields.map((f) => [parentNameKey(f.parent_id, f.name), f]),
    ),
    input.parentId,
    input.name,
  )

  if (existing) return existing

  const kind = domTypeToKind(parseDomType(input.domType ?? undefined))
  const pageId = input.context.globalId ? null : (input.context.pageId ?? content.page.id)
  const globalId = input.context.globalId ?? null

  const { data: inserted, error } = await supabase
    .from('fields')
    .insert({
      page_id: pageId,
      global_id: globalId,
      parent_id: input.parentId,
      name: input.name,
      kind,
      plain_text: null,
      richtext: null,
      link: null,
      image: null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return inserted as FieldRow
}

/**
 * Builds ensure input from a named DOM element.
 */
export function ensureInputFromElement(
  element: HTMLElement,
  context: FieldParentContext,
  sortOrder = 0,
): EnsureFieldInput | null {
  const name = element.dataset.name?.trim()
  if (!name) return null

  return {
    name,
    parentId: context.parentId,
    context,
    domType: element.dataset.type ?? null,
    sortOrder,
  }
}
