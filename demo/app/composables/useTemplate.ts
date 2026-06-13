import type { Component } from 'vue'
import DefaultPage from '~/templates/DefaultPage.vue'
import SectionsDemoPage from '~/templates/SectionsDemoPage.vue'

const TEMPLATE_MAP: Record<string, Component> = {
  default: DefaultPage,
  'sections-demo': SectionsDemoPage,
  /** @deprecated Use sections-demo */
  'slice-demo': SectionsDemoPage,
}

/**
 * Resolves a Vue template component from a Supabase template key.
 */
export function resolveTemplateComponent(
  templateKey: string,
): Component | null {
  return TEMPLATE_MAP[templateKey] ?? null
}
