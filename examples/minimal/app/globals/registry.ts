import type { GlobalDefinition } from '~/types/cms'

/**
 * Minimal example — no global regions registered.
 */
export function getGlobalDefinition(_key: string): GlobalDefinition | null {
  return null
}

export function listGlobalDefinitions(): GlobalDefinition[] {
  return []
}
