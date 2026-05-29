import type { FieldRow } from '~/types/cms'
import { getFieldTypeConfig } from '~/fields/registry'
import { updateFieldValue } from '~/composables/usePageContent'

interface PageEditorRegistry {
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>
}

/** Client-only callback — must not live in useState (breaks prerender payload). */
let fieldUpdatedHandler: ((field: FieldRow) => void) | null = null

/**
 * Singleton editor state: active field, modal, save to Supabase.
 */
export function usePageEditor() {
  const activeField = useState<FieldRow | null>('page-editor-active', () => null)
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
    fieldsByName: Record<string, FieldRow>,
  ) {
    registry.value = { fieldsById, fieldsByName }
  }

  /**
   * Opens the edit modal for a field.
   */
  function open(field: FieldRow) {
    const config = getFieldTypeConfig(field.type)
    if (!config) return

    activeField.value = field
    draftValue.value = config.valueToDraft(field.value)
    isOpen.value = true
  }

  /**
   * Closes the modal without saving.
   */
  function close() {
    isOpen.value = false
    activeField.value = null
    draftValue.value = ''
  }

  /**
   * Persists draft value and notifies the editor store via the registered handler.
   */
  async function save(): Promise<void> {
    const field = activeField.value
    if (!field) return

    const config = getFieldTypeConfig(field.type)
    if (!config) return

    const value = config.draftToValue(draftValue.value)
    const updated = await updateFieldValue(field.id, value)
    fieldUpdatedHandler?.(updated)
    close()
  }

  /**
   * Resolves a field from a clicked element's data attributes.
   */
  function resolveFieldFromElement(el: HTMLElement): FieldRow | null {
    if (!registry.value) return null

    const id = el.dataset.id
    if (id && registry.value.fieldsById[id]) {
      return registry.value.fieldsById[id]
    }

    const name = el.dataset.name
    if (!name) return null

    if (registry.value.fieldsByName[name]) {
      return registry.value.fieldsByName[name]
    }

    const matches = Object.values(registry.value.fieldsById).filter(
      (f) => f.name === name,
    )
    const [field] = matches
    return matches.length === 1 && field ? field : null
  }

  function setDraft(value: string) {
    draftValue.value = value
  }

  /**
   * Scrolls to a field or slice on the page and briefly highlights it.
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

  /**
   * Scrolls to a slice wrapper element by instance id.
   */
  function focusSliceOnPage(sliceId: string): void {
    if (!import.meta.client) return

    const el = document.querySelector(
      `[data-slice-id="${sliceId}"]`,
    ) as HTMLElement | null
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('cms-field-highlight')
    window.setTimeout(() => el.classList.remove('cms-field-highlight'), 1500)
  }

  return {
    activeField,
    draftValue,
    isOpen,
    registerFields,
    setFieldUpdatedHandler,
    open,
    close,
    save,
    setDraft,
    resolveFieldFromElement,
    focusOnPage,
    focusSliceOnPage,
    registry,
  }
}
