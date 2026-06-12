import type { FieldRow } from '~/types/cms'
import { emptyFieldRow, getFieldColumnValue } from '~/fields/fieldValues'
import { resolveFieldByParent } from '~/fields/resolveField'

/**
 * Resolves a field row by parent id and name from page content, returning an empty
 * placeholder when the row does not exist yet (guest / before ensure).
 */
export function useCmsField(
  fieldsByParentAndName: Record<string, FieldRow>,
  parentId: string | null,
  name: string,
): FieldRow {
  return (
    resolveFieldByParent(fieldsByParentAndName, parentId, name) ??
    emptyFieldRow(name, parentId)
  )
}

/**
 * Reads a typed column value from a field row with empty-string fallback.
 */
export function cmsColumnValue(
  field: FieldRow,
  column: 'plain_text' | 'richtext' | 'link' | 'image',
): string {
  return getFieldColumnValue(field, column) ?? ''
}
