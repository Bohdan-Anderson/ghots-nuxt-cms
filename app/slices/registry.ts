import type { Component } from 'vue'
import type { SliceTypeDefinition } from '~/types/cms'
import HeroSlice from '~/slices/HeroSlice.vue'
import CtaSlice from '~/slices/CtaSlice.vue'

const SLICE_COMPONENTS: Record<string, Component> = {
  hero: HeroSlice,
  cta: CtaSlice,
}

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
      {
        name: 'copy',
        type: 'richtext',
        default: 'Welcome to our **demo**.',
      },
      { name: 'cta_link', type: 'link', default: 'https://example.com' },
    ],
  },
}

/**
 * Returns the Vue component for a slice type key, or null if unknown.
 */
export function resolveSliceComponent(sliceTypeKey: string): Component | null {
  return SLICE_COMPONENTS[sliceTypeKey] ?? null
}

/**
 * Returns slice type metadata and field schema from the code registry.
 */
export function getSliceDefinition(
  sliceTypeKey: string,
): SliceTypeDefinition | null {
  return SLICE_DEFINITIONS[sliceTypeKey] ?? null
}

/**
 * Lists all registered slice types (for sidebar add-slice UI in Phase 3).
 */
export function listSliceDefinitions(): SliceTypeDefinition[] {
  return Object.values(SLICE_DEFINITIONS)
}
