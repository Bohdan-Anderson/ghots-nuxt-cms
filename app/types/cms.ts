/**
 * CMS domain types for pages, templates, and fields.
 */

export type FieldType = 'section' | 'plain_text'

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
  created_at: string
  updated_at: string
  templates?: TemplateRow
}

export interface FieldRow {
  id: string
  page_id: string
  parent_id: string | null
  name: string
  type: FieldType
  value: string | null
  sort_order: number
}

export interface PageContent {
  page: PageRow
  template: TemplateRow
  fields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  /** Root-level and nested lookup by name (first match at each scope is via field() helper). */
  fieldsByName: Record<string, FieldRow>
}
