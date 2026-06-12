import type { GlobalDefinition } from '~/types/cms'

const GLOBAL_DEFINITIONS: Record<string, GlobalDefinition> = {
  site: {
    key: 'site',
    label: 'Site settings',
  },
}

/**
 * Returns global region metadata from the code registry.
 */
export function getGlobalDefinition(key: string): GlobalDefinition | null {
  return GLOBAL_DEFINITIONS[key] ?? null
}

/**
 * Lists all registered global regions.
 */
export function listGlobalDefinitions(): GlobalDefinition[] {
  return Object.values(GLOBAL_DEFINITIONS)
}
