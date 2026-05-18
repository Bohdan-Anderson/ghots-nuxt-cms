import type {
  FieldRow,
  FieldSchemaNode,
  PageContent,
  PageRow,
  TemplateRow,
} from '~/types/cms'
import { normalizeSlug } from '~/utils/slug'

/**
 * Fetches page + template + fields; seeds empty fields for logged-in editors on first visit.
 */
export async function usePageContent(slugInput: string): Promise<PageContent | null> {
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

  let { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  if (fieldsError) throw fieldsError

  if (loggedIn.value && (!fields || fields.length === 0)) {
    await seedFieldsFromSchema(supabase, page.id, template.field_schema)
    const refetch = await supabase
      .from('fields')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order', { ascending: true })
    if (refetch.error) throw refetch.error
    fields = refetch.data
  }

  const fieldList = (fields ?? []) as FieldRow[]
  const { fieldsById, fieldsByName } = buildFieldMaps(fieldList)

  return toPageContentPayload(page, template, fieldList, fieldsById, fieldsByName)
}

/**
 * Returns a JSON-serializable page payload for useAsyncData / prerender.
 */
function toPageContentPayload(
  page: PageRow,
  template: TemplateRow,
  fields: FieldRow[],
  fieldsById: Record<string, FieldRow>,
  fieldsByName: Record<string, FieldRow>,
): PageContent {
  return {
    page: {
      id: page.id,
      slug: page.slug,
      template_id: page.template_id,
      title: page.title,
      created_at: page.created_at,
      updated_at: page.updated_at,
    },
    template: {
      id: template.id,
      key: template.key,
      label: template.label,
      field_schema: template.field_schema,
    },
    fields,
    fieldsById,
    fieldsByName,
  }
}

/**
 * Resolves a field by name, optionally scoped to a parent section name.
 */
export function resolveField(
  fields: FieldRow[],
  name: string,
  parentSectionName?: string,
): FieldRow | undefined {
  if (!parentSectionName) {
    return fields.find((f) => f.name === name && f.parent_id === null)
  }
  const parent = fields.find(
    (f) => f.name === parentSectionName && f.type === 'section' && f.parent_id === null,
  )
  if (!parent) return undefined
  return fields.find((f) => f.name === name && f.parent_id === parent.id)
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

function buildFieldMaps(fields: FieldRow[]) {
  const fieldsById: Record<string, FieldRow> = {}
  const fieldsByName: Record<string, FieldRow> = {}

  for (const field of fields) {
    fieldsById[field.id] = field
    if (field.parent_id === null) {
      fieldsByName[field.name] = field
    }
  }

  return { fieldsById, fieldsByName }
}

async function seedFieldsFromSchema(
  supabase: ReturnType<typeof useSupabase>,
  pageId: string,
  schema: FieldSchemaNode[],
  parentId: string | null = null,
  startOrder = 0,
): Promise<void> {
  let order = startOrder

  for (const node of schema) {
    const { data: inserted, error } = await supabase
      .from('fields')
      .insert({
        page_id: pageId,
        parent_id: parentId,
        name: node.name,
        type: node.type,
        value: node.type === 'plain_text' ? (node.default ?? '') : null,
        sort_order: order++,
      })
      .select('id')
      .single()

    if (error) throw error

    if (node.type === 'section' && node.children?.length) {
      await seedFieldsFromSchema(
        supabase,
        pageId,
        node.children,
        inserted.id,
        0,
      )
    }
  }
}
