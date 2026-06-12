/**
 * CMS domain types for pages, templates, globals, and fields.
 */

/** Value column names — which typed column to read/write. */
export type ValueColumn = 'plain_text' | 'richtext' | 'link' | 'image'

/** DOM-declared editor types (editable leaves). */
export type EditableFieldType = ValueColumn

/** Structural row kinds stored in DB (not value types). */
export type FieldKind = 'section' | 'array'

export interface SiteRow {
  id: string
  key: string
  label: string
  created_at: string
}

export interface TemplateRow {
  id: string
  site_id: string
  key: string
  label: string
  /** @deprecated DOM is schema; kept for DB compat, always `[]`. */
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

export interface GlobalRow {
  id: string
  site_id: string
  key: string
  label: string
  created_at: string
}

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

export interface PageContent {
  page: PageRow
  template: TemplateRow
  fields: FieldRow[]
  pageFields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  /** Root-level page fields keyed by name (parent_id null). */
  fieldsByName: Record<string, FieldRow>
  /** All fields keyed by (parentId|null):(name). */
  fieldsByParentAndName: Record<string, FieldRow>
}

export interface GlobalContent {
  global: GlobalRow
  fields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>
  fieldsByParentAndName: Record<string, FieldRow>
}

export interface GlobalDefinition {
  key: string
  label: string
}

/** DOM-scanned node for sidebar tree. */
export interface ContentTreeNode {
  id: string | null
  name: string
  domType: string | null
  kind: FieldKind | null
  depth: number
  children: ContentTreeNode[]
  /** Resolved parent field row id for registry lookup. */
  parentFieldId?: string | null
  /** Set on editable leaves — which column has content for preview. */
  previewColumn?: ValueColumn | null
}

/** Resolved parent context from DOM walk. */
export interface FieldParentContext {
  pageId: string | null
  globalId: string | null
  parentId: string | null
}
