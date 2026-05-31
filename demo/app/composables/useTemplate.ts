import type { Component } from 'vue'
import DefaultPage from '~/templates/DefaultPage.vue'
import SliceDemoPage from '~/templates/SliceDemoPage.vue'

const TEMPLATE_MAP: Record<string, Component> = {
  default: DefaultPage,
  'slice-demo': SliceDemoPage,
}

/**
 * Resolves a Vue template component from a Supabase template key.
 */
export function resolveTemplateComponent(templateKey: string): Component | null {
  return TEMPLATE_MAP[templateKey] ?? null
}
