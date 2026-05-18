import type { FieldRow } from '~/types/cms'
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
    activeField.value = field
    draftValue.value = field.value ?? ''
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
   * Persists draft value and patches local registry.
   */
  async function save(): Promise<void> {
    const field = activeField.value
    if (!field || !registry.value) return

    const updated = await updateFieldValue(field.id, draftValue.value)
    registry.value.fieldsById[updated.id] = updated
    if (updated.parent_id === null) {
      registry.value.fieldsByName[updated.name] = updated
    }
    fieldUpdatedHandler?.(updated)
    close()
    return
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
    return matches.length === 1 ? matches[0] : null
  }

  function setDraft(value: string) {
    draftValue.value = value
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
    registry,
  }
}
