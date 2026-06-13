import type { EditableFieldType, FieldRow } from '~/types/cms'
import { getFieldTypeConfig } from '~/fields/registry'
import { getFieldColumnValue } from '~/fields/fieldValues'
import { updateFieldColumn } from '~/composables/usePageContent'
import {
  isEditableDomType,
  parseDomType,
  resolveFieldBinding,
} from '~/fields/domContext'

interface PageEditorRegistry {
  fieldsById: Record<string, FieldRow>
  fieldsByParentAndName: Record<string, FieldRow>
}

/** Client-only callbacks — must not live in useState (breaks prerender payload). */
const fieldUpdatedHandlers = new Set<(field: FieldRow) => void>()

/**
 * Singleton editor state: active field, modal, save to Supabase.
 */
export function usePageEditor() {
  const activeField = useState<FieldRow | null>(
    'page-editor-active',
    () => null,
  )
  const activeColumn = useState<EditableFieldType | null>(
    'page-editor-column',
    () => null,
  )
  const draftValue = useState<string>('page-editor-draft', () => '')
  const isOpen = useState<boolean>('page-editor-open', () => false)
  const registry = useState<PageEditorRegistry | null>(
    'page-editor-registry',
    () => null,
  )

  /**
   * Registers a client-side handler when a field is saved (not serialized).
   */
  function setFieldUpdatedHandler(handler: ((field: FieldRow) => void) | null) {
    fieldUpdatedHandlers.clear()
    if (handler) fieldUpdatedHandlers.add(handler)
  }

  /**
   * Adds a save listener without replacing existing handlers (e.g. globals + page).
   */
  function addFieldUpdatedHandler(
    handler: (field: FieldRow) => void,
  ): () => void {
    fieldUpdatedHandlers.add(handler)
    return () => fieldUpdatedHandlers.delete(handler)
  }

  /**
   * Registers field maps for click-delegation lookup (merges with existing globals).
   */
  function registerFields(
    fieldsById: Record<string, FieldRow>,
    fieldsByParentAndName: Record<string, FieldRow>,
  ) {
    const current = registry.value
    registry.value = {
      fieldsById: { ...current?.fieldsById, ...fieldsById },
      fieldsByParentAndName: {
        ...current?.fieldsByParentAndName,
        ...fieldsByParentAndName,
      },
    }
  }

  /**
   * Opens the edit modal for a field and value column.
   */
  function open(field: FieldRow, column: EditableFieldType) {
    const config = getFieldTypeConfig(column)
    if (!config) return

    activeField.value = field
    activeColumn.value = column
    draftValue.value = config.valueToDraft(getFieldColumnValue(field, column))
    isOpen.value = true
  }

  /**
   * Closes the modal without saving.
   */
  function close() {
    isOpen.value = false
    activeField.value = null
    activeColumn.value = null
    draftValue.value = ''
  }

  /**
   * Persists draft value to the active column and notifies the editor handler.
   */
  async function save(): Promise<void> {
    const field = activeField.value
    const column = activeColumn.value
    if (!field || !column) return

    const config = getFieldTypeConfig(column)
    if (!config) return

    const value = config.draftToValue(draftValue.value)
    const updated = await updateFieldColumn(field.id, column, value)
    for (const handler of fieldUpdatedHandlers) {
      handler(updated)
    }
    close()
  }

  /**
   * Resolves a field from a clicked element's data attributes and parent context.
   */
  function resolveFieldFromElement(el: HTMLElement): FieldRow | null {
    if (!registry.value) return null
    return resolveFieldBinding(el, registry.value)?.field ?? null
  }

  /**
   * Returns the editable column type from a clicked element's data-type.
   */
  function editableColumnFromElement(
    el: HTMLElement,
  ): EditableFieldType | null {
    const domType = parseDomType(el.dataset.type)
    return isEditableDomType(domType) ? domType : null
  }

  function setDraft(value: string) {
    draftValue.value = value
  }

  /**
   * Scrolls to a field on the page and briefly highlights it.
   */
  function focusOnPage(field: FieldRow): void {
    if (!import.meta.client) return

    const selector = field.id
      ? `[data-id="${field.id}"]`
      : `[data-name="${field.name}"]`
    const el = document.querySelector(selector) as HTMLElement | null
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('cms-field-highlight')
    window.setTimeout(() => el.classList.remove('cms-field-highlight'), 1500)
  }

  return {
    activeField,
    activeColumn,
    draftValue,
    isOpen,
    registerFields,
    setFieldUpdatedHandler,
    addFieldUpdatedHandler,
    open,
    close,
    save,
    setDraft,
    resolveFieldFromElement,
    editableColumnFromElement,
    focusOnPage,
    registry,
  }
}
