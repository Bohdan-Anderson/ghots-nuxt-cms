import type {
  FieldRow,
  PageContent,
  PageRow,
  TemplateRow,
} from '~/types/cms'
import {
  buildFieldMaps,
  pageLevelFields,
  seedFieldsFromSchema,
} from '~/composables/seedFields'
import { fetchPageSlices } from '~/composables/usePageSlices'
import { normalizeSlug } from '~/utils/slug'

/**
 * Fetches page + template + slices + fields; seeds empty page-level fields for logged-in editors.
 */
export async function usePageContent(
  slugInput: string,
): Promise<PageContent | null> {
  const supabase = useSupabase()
  const { loggedIn } = useAuth()
  const slug = normalizeSlug(slugInput)

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*, templates(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (pageError) throw pageError
  if (!pageData) return null

  const page = pageData as PageRow & { templates: TemplateRow }
  const template = page.templates

  const slices = await fetchPageSlices(supabase, page.id)

  let { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) throw fieldsError

  const pageFieldCount = (fields ?? []).filter((f) => f.slice_id === null).length

  if (loggedIn.value && pageFieldCount === 0) {
    await seedFieldsFromSchema(supabase, template.field_schema, {
      pageId: page.id,
    })
    const refetch = await supabase
      .from('fields')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order', { ascending: true })
    if (refetch.error) throw refetch.error
    fields = refetch.data
  }

  const fieldList = (fields ?? []) as FieldRow[]
  const { fieldsById, fieldsByName, fieldsBySliceId } = buildFieldMaps(fieldList)

  return toPageContentPayload(
    page,
    template,
    slices,
    fieldList,
    fieldsById,
    fieldsByName,
    fieldsBySliceId,
  )
}

/**
 * Returns a JSON-serializable page payload for useAsyncData / prerender.
 */
function toPageContentPayload(
  page: PageRow,
  template: TemplateRow,
  slices: PageContent['slices'],
  fields: FieldRow[],
  fieldsById: Record<string, FieldRow>,
  fieldsByName: Record<string, FieldRow>,
  fieldsBySliceId: Record<string, FieldRow[]>,
): PageContent {
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
 * Resolves a field by name, optionally scoped to a parent section and/or slice instance.
 */
export function resolveField(
  fields: FieldRow[],
  name: string,
  parentSectionName?: string,
  sliceId?: string | null,
): FieldRow | undefined {
  const scoped = fields.filter((field) =>
    sliceId ? field.slice_id === sliceId : field.slice_id === null,
  )

  if (!parentSectionName) {
    return scoped.find((field) => field.name === name && field.parent_id === null)
  }

  const parent = scoped.find(
    (field) =>
      field.name === parentSectionName &&
      field.type === 'section' &&
      field.parent_id === null,
  )
  if (!parent) return undefined
  return scoped.find(
    (field) => field.name === name && field.parent_id === parent.id,
  )
}

/**
 * Returns ordered field groups for each item in a repeatable array field.
 */
export function resolveArrayItems(
  fields: FieldRow[],
  arrayName: string,
  sliceId?: string | null,
): FieldRow[][] {
  const scoped = fields.filter((field) =>
    sliceId ? field.slice_id === sliceId : field.slice_id === null,
  )

  const arrayField = scoped.find(
    (field) => field.name === arrayName && field.type === 'array',
  )
  if (!arrayField) return []

  const itemSections = scoped
    .filter(
      (field) =>
        field.parent_id === arrayField.id && field.type === 'section',
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  return itemSections.map((item) =>
    scoped
      .filter((field) => field.parent_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  )
}

/**
 * Updates a field value in Supabase.
 */
export async function updateFieldValue(
  fieldId: string,
  value: string,
): Promise<FieldRow> {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('fields')
    .update({ value })
    .eq('id', fieldId)
    .select('*')
    .single()

  if (error) throw error
  return data as FieldRow
}
