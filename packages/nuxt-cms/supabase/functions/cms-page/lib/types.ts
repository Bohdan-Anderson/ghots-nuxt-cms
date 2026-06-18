/** Structural row kinds stored in DB (not value types). */
export type FieldKind = 'section' | 'array'

export interface TemplateRow {
  id: string
  site_id: string
  key: string
  label: string
  field_schema: unknown[]
}

export interface PageRow {
  id: string
  site_id: string
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

/** Flat DB row (used internally for reads/writes). */
export interface FieldRow {
  id: string
  page_id: string | null
  global_id: string | null
  parent_id: string | null
  name: string
  kind: FieldKind | null
  plain_text: string | null
  richtext: string | null
  link: string | null
  image: string | null
  sort_order: number
}

/**
 * Nested field node returned by the edge function API.
 * Sections and arrays include `children`; leaves omit it.
 */
export interface NestedFieldNode {
  id: string
  name: string
  kind: FieldKind | null
  plain_text: string | null
  richtext: string | null
  link: string | null
  image: string | null
  sort_order: number
  children?: NestedFieldNode[]
}

/** Edge function GET/PUT/POST page payload. */
export interface PageApiContent {
  page: Omit<PageRow, 'site_id' | 'templates'>
  template: Omit<TemplateRow, 'site_id'>
  fields: NestedFieldNode[]
}

export interface WriteRequestBody {
  email: string
  password: string
  content: PageApiContent
}

export interface PageMetaInput {
  title?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image?: string | null
  noindex?: boolean
}

export interface AuthBody {
  email: string
  password: string
}

export interface CreatePageBody extends AuthBody {
  slug: string
  template_key: string
  title?: string | null
}

export interface CreatePageInput {
  slug: string
  templateKey: string
  title?: string | null
}

export interface CreateTemplateBody extends AuthBody {
  key: string
  label: string
}

export interface CreateTemplateInput {
  key: string
  label: string
}

export interface DeleteResult {
  deleted: true
  id: string
  slug?: string
  key?: string
}
