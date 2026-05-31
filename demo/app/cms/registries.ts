/**
 * Consumer registry barrel — required by @ghots/nuxt-cms.
 * Re-export template, slice, and global resolvers from site-specific code.
 */
export { resolveTemplateComponent } from '~/composables/useTemplate'
export {
  getSliceDefinition,
  listSliceDefinitions,
  resolveSliceComponent,
} from '~/slices/registry'
export {
  getGlobalDefinition,
  listGlobalDefinitions,
} from '~/globals/registry'
