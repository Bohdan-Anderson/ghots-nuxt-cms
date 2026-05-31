import type { Component } from 'vue'
import type { SliceTypeDefinition } from '~/types/cms'

const SLICE_DEFINITIONS: SliceTypeDefinition[] = []
const SLICE_COMPONENTS: Record<string, Component> = {}

/**
 * Returns slice type metadata from the code registry.
 */
export function getSliceDefinition(key: string): SliceTypeDefinition | undefined {
  return SLICE_DEFINITIONS.find((def) => def.key === key)
}

/**
 * Lists all registered slice types (empty in minimal example).
 */
export function listSliceDefinitions(): SliceTypeDefinition[] {
  return SLICE_DEFINITIONS
}

/**
 * Resolves a slice Vue component from a type key.
 */
export function resolveSliceComponent(key: string): Component | null {
  return SLICE_COMPONENTS[key] ?? null
}
