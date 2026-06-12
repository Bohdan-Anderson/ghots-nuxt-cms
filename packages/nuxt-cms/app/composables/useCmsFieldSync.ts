/**
 * Shared DOM field sync hook registered by PageEditorProvider.
 */
export function useCmsFieldSync() {
  const syncFn = useState<(() => Promise<void>) | null>(
    'cms-field-sync-fn',
    () => null,
  )

  /**
   * Registers the active page's DOM field sync callback.
   */
  function registerFieldSync(fn: (() => Promise<void>) | null) {
    syncFn.value = fn
  }

  /**
   * Requests a DOM field sync after panel mutations (e.g. new array items).
   */
  async function requestFieldSync(): Promise<void> {
    await syncFn.value?.()
  }

  return { registerFieldSync, requestFieldSync }
}
