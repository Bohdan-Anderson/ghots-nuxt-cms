import type { FieldRow, ValueColumn } from '~/types/cms'

/**
 * Reads a typed value column from a field row.
 */
export function getFieldColumnValue(
  field: FieldRow,
  column: ValueColumn,
): string | null {
  return field[column]
}

/**
 * Returns the first non-empty value column on a row (for sidebar preview).
 */
export function firstPopulatedColumn(
  field: FieldRow,
): ValueColumn | null {
  const columns: ValueColumn[] = ['plain_text', 'richtext', 'link', 'image']
  for (const column of columns) {
    const value = field[column]
    if (value != null && value !== '') return column
  }
  return null
}

/**
 * Returns an empty field row shape for templates before ensure runs.
 */
export function emptyFieldRow(
  name: string,
  parentId: string | null = null,
): FieldRow {
  return {
    id: '',
    page_id: null,
    global_id: null,
    parent_id: parentId,
    name,
    kind: null,
    plain_text: null,
    richtext: null,
    link: null,
    image: null,
    sort_order: 0,
  }
}
