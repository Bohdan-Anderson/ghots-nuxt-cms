import type { Component } from 'vue'
import type { SliceTypeDefinition } from '~/types/cms'
import HeroSlice from '~/slices/HeroSlice.vue'

const SLICE_COMPONENTS: Record<string, Component> = {
  hero: HeroSlice,
}

const SLICE_DEFINITIONS: Record<string, SliceTypeDefinition> = {
  hero: {
    key: 'hero',
    label: 'Hero',
    fieldSchema: [{ name: 'headline', type: 'plain_text', default: '' }],
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
