import type { GlobalDefinition } from '~/types/cms'

const GLOBAL_DEFINITIONS: Record<string, GlobalDefinition> = {
  site: {
    key: 'site',
    label: 'Site settings',
    fieldSchema: [{ name: 'nav_label', type: 'plain_text', default: 'My Site' }],
  },
}

/**
 * Returns global region metadata and field schema from the code registry.
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
