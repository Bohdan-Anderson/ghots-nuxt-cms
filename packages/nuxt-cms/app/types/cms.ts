/**
 * CMS domain types for pages, templates, slices, globals, and fields.
 */

export type FieldType =
  | 'section'
  | 'plain_text'
  | 'link'
  | 'richtext'
  | 'image'
  | 'array'

export interface FieldSchemaNode {
  name: string
  type: FieldType
  default?: string
  children?: FieldSchemaNode[]
}

export interface TemplateRow {
  id: string
  key: string
  label: string
  field_schema: FieldSchemaNode[]
}

export interface PageRow {
  id: string
  slug: string
  template_id: string
  title: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  noindex: boolean
  created_at: string
  updated_at: string
  templates?: TemplateRow
}

export interface PageSliceRow {
  id: string
  page_id: string
  slice_type_key: string
  sort_order: number
}

export interface GlobalRow {
  id: string
  key: string
  label: string
  created_at: string
}

export interface FieldRow {
  id: string
  page_id: string | null
  slice_id: string | null
  global_id: string | null
  parent_id: string | null
  name: string
  type: FieldType
  value: string | null
  sort_order: number
}

export interface PageContent {
  page: PageRow
  template: TemplateRow
  slices: PageSliceRow[]
  /** All field rows for this page (page-level + slice-owned). */
  fields: FieldRow[]
  /** Page-level fields only (`slice_id` is null). */
  pageFields: FieldRow[]
  fieldsBySliceId: Record<string, FieldRow[]>
  fieldsById: Record<string, FieldRow>
  /** Root-level page fields only (not inside slices). */
  fieldsByName: Record<string, FieldRow>
}

export interface GlobalContent {
  global: GlobalRow
  fields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>
}

export interface SliceTypeDefinition {
  key: string
  label: string
  fieldSchema: FieldSchemaNode[]
}

export interface GlobalDefinition {
  key: string
  label: string
  fieldSchema: FieldSchemaNode[]
}
