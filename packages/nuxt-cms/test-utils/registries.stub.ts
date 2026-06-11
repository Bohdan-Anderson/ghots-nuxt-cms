import type { GlobalDefinition, SliceTypeDefinition } from '../app/types/cms'

const SLICE_DEFINITIONS: Record<string, SliceTypeDefinition> = {
  hero: {
    key: 'hero',
    label: 'Hero',
    fieldSchema: [{ name: 'headline', type: 'plain_text', default: '' }],
  },
  cta: {
    key: 'cta',
    label: 'CTA',
    fieldSchema: [
      { name: 'copy', type: 'richtext', default: '' },
      { name: 'cta_link', type: 'link', default: '' },
    ],
  },
  team: {
    key: 'team',
    label: 'Team',
    fieldSchema: [
      { name: 'heading', type: 'plain_text', default: '' },
      {
        name: 'members',
        type: 'array',
        children: [
          { name: 'name', type: 'plain_text', default: '' },
          { name: 'photo', type: 'image' },
        ],
      },
    ],
  },
}

/**
 * Test stub for slice registry lookups.
 */
export function getSliceDefinition(
  sliceTypeKey: string,
): SliceTypeDefinition | null {
  return SLICE_DEFINITIONS[sliceTypeKey] ?? null
}

export function listSliceDefinitions(): SliceTypeDefinition[] {
  return Object.values(SLICE_DEFINITIONS)
}

export function resolveSliceComponent(): null {
  return null
}

export function resolveTemplateComponent(): null {
  return null
}

export function getGlobalDefinition(): GlobalDefinition | null {
  return null
}

export function listGlobalDefinitions(): GlobalDefinition[] {
  return []
}
