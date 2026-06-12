import type { EditableFieldType, FieldRow } from '~/types/cms'
import { getFieldTypeConfig } from '~/fields/registry'
import { getFieldColumnValue } from '~/fields/fieldValues'
import { updateFieldColumn } from '~/composables/usePageContent'
import {
  isEditableDomType,
  parseDomType,
  resolveFieldParentContext,
} from '~/fields/domContext'
import { parentNameKey } from '~/fields/maps'

interface PageEditorRegistry {
  fieldsById: Record<string, FieldRow>
  fieldsByParentAndName: Record<string, FieldRow>
}

/** Client-only callback — must not live in useState (breaks prerender payload). */
let fieldUpdatedHandler: ((field: FieldRow) => void) | null = null

/**
 * Singleton editor state: active field, modal, save to Supabase.
 */
export function usePageEditor() {
  const activeField = useState<FieldRow | null>('page-editor-active', () => null)
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
  function setFieldUpdatedHandler(
    handler: ((field: FieldRow) => void) | null,
  ) {
    fieldUpdatedHandler = handler
  }

  /**
   * Registers the current page field maps for click-delegation lookup.
   */
  function registerFields(
    fieldsById: Record<string, FieldRow>,
    fieldsByParentAndName: Record<string, FieldRow>,
  ) {
    registry.value = { fieldsById, fieldsByParentAndName }
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
    fieldUpdatedHandler?.(updated)
    close()
  }

  /**
   * Resolves a field from a clicked element's data attributes and parent context.
   */
  function resolveFieldFromElement(el: HTMLElement): FieldRow | null {
    if (!registry.value) return null

    const id = el.dataset.id
    if (id && registry.value.fieldsById[id]) {
      return registry.value.fieldsById[id]
    }

    const name = el.dataset.name
    if (!name) return null

    const context = resolveFieldParentContext(el)
    const key = parentNameKey(context.parentId, name)
    if (registry.value.fieldsByParentAndName[key]) {
      return registry.value.fieldsByParentAndName[key]
    }

    if (!context.parentId) {
      const rootMatches = Object.values(registry.value.fieldsById).filter(
        (f) => f.name === name && f.parent_id === null,
      )
      if (rootMatches.length === 1) return rootMatches[0]!
    }

    return null
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
