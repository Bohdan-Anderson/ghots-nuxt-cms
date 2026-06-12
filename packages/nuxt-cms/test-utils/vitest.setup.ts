import { ref } from 'vue'
import { beforeEach, vi } from 'vitest'

const useStateStore = new Map<string, ReturnType<typeof ref>>()

/**
 * Minimal Nuxt `useState` stub for composable unit tests.
 */
vi.stubGlobal('useState', (key: string, init: () => unknown) => {
  if (!useStateStore.has(key)) {
    useStateStore.set(key, ref(init()))
  }
  return useStateStore.get(key)!
})

beforeEach(() => {
  useStateStore.clear()
})
