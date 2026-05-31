import type {
  FieldRow,
  PageContent,
  PageRow,
  PageSliceRow,
  TemplateRow,
} from '../types/cms'
import { buildFieldMaps, pageLevelFields } from './maps'

/**
 * Rebuilds derived maps after slices or fields change (sidebar structural edits).
 */
export function rebuildPageContent(
  current: PageContent,
  updates: {
    fields?: FieldRow[]
    slices?: PageSliceRow[]
    page?: PageContent['page']
  },
): PageContent {
  const fields = updates.fields ?? current.fields
  const slices = updates.slices ?? current.slices
  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fields)

  return {
    ...current,
    page: updates.page ?? current.page,
    fields,
    slices,
    pageFields: pageLevelFields(fields),
    fieldsBySliceId,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Returns a JSON-serializable page payload for useAsyncData / prerender.
 */
export function buildPageContentPayload(
  page: PageRow,
  template: TemplateRow,
  slices: PageContent['slices'],
  fields: FieldRow[],
): PageContent {
  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fields)

  return {
    page: {
      id: page.id,
      slug: page.slug,
      template_id: page.template_id,
      title: page.title,
      meta_title: page.meta_title ?? null,
      meta_description: page.meta_description ?? null,
      og_image: page.og_image ?? null,
      noindex: page.noindex ?? false,
      created_at: page.created_at,
      updated_at: page.updated_at,
    },
    template: {
      id: template.id,
      key: template.key,
      label: template.label,
      field_schema: template.field_schema,
    },
    slices,
    fields,
    pageFields: pageLevelFields(fields),
    fieldsBySliceId,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Returns page content with one field replaced (immutable update for reactivity).
 */
export function patchFieldInContent(
  current: PageContent,
  updated: FieldRow,
): PageContent {
  const index = current.fields.findIndex((field) => field.id === updated.id)
  const fields =
    index >= 0
      ? current.fields.map((field, i) => (i === index ? updated : field))
      : [...current.fields, updated]

  return rebuildPageContent(current, { fields })
}
