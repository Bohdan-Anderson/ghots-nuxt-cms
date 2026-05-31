import type { GlobalDefinition } from '~/types/cms'

const GLOBALS: GlobalDefinition[] = []

/**
 * Returns a global region definition from the code registry.
 */
export function getGlobalDefinition(key: string): GlobalDefinition | undefined {
  return GLOBALS.find((def) => def.key === key)
}

/**
 * Lists all registered global regions (empty in minimal example).
 */
export function listGlobalDefinitions(): GlobalDefinition[] {
  return GLOBALS
}
