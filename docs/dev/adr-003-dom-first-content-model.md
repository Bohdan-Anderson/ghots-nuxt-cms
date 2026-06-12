# ADR 003 — DOM-first content model (wide rows, no slices)

**Status:** Accepted  
**Date:** 2026-06-11  
**Supersedes:** Parts of ADR 002 (slice instances, schema-first fields)

## Context

The v2 model (ADR 002) stores one EAV row per field node with a `type` column and single `value` text column. Field types are resolved from JSON schemas (`templates.field_schema`, slice/global registries) with DOM `data-type` as a fallback. This creates finicky sync logic, duplicate schema definitions, and tight coupling between DB rows and markup.

Editors and developers want **Vue templates to be the schema**: structure comes from rendered markup; clicking an element uses its `data-type` to choose the editor and save column.

## Decisions

### 1. Wide field rows — typed value columns, no value `type`

**Choice:** Each `fields` row is a named slot under a parent. Values live in nullable columns: `plain_text`, `richtext`, `link`, `image`. The same row may hold values in multiple columns (discouraged but allowed).

**Removed:** `type` (for value types), `value` (single column).

**Structural rows:** Sections and arrays use a `kind` column (`section`, `array`) with all value columns null. Array item sections use `kind = section` and names `item_N`.

### 2. DOM is the schema

**Choice:** Templates declare structure via attributes:

| Attribute | Purpose |
| --------- | ------- |
| `data-type="page"` | Page root; `data-id` = page UUID |
| `data-type="section"` | Section container; `data-name` + `data-id` |
| `data-type="array"` | Repeatable hook (sidebar-managed) |
| `data-global="key"` | Global region scope |
| `data-name` | Row key within parent |
| `data-type` (leaf) | Editor UI: `plain_text`, `link`, `richtext`, `image` |
| `data-id` | Stable UUID after ensure |

Parent resolution walks DOM ancestors for the nearest structural parent (`section` or `array`) by `data-name`, then resolves its field row id from the registry (or `data-id` when present). `data-global` ancestors scope fields to the global namespace.

### 3. Lazy ensure — no proactive schema seeding

**Choice:** `ensureField(parentId, name)` creates empty rows on demand for logged-in editors. No `seedFieldsFromSchema` on first visit. `templates.field_schema` deprecated (empty).

On first editor visit, markup may render before any field rows exist (`:data-id` empty). `syncFieldsFromDom` collects all `[data-name]` nodes missing a valid registry id, sorts them **shallowest-first** by DOM depth, and ensures each in one pass — parents are always created before children. The same `resolveFieldBinding` helper is used for sync, click-to-edit, globals, and the sidebar tree.

### 4. Drop slice instances

**Choice:** Remove `page_slices` table and `fields.slice_id`. Reusable blocks are developer-placed Vue section components or array repeatables — not editor-added slice instances.

### 5. Sidebar tree from DOM

**Choice:** After render, `scanContentTree(root)` builds the content tree for the sidebar. Stored in `useContentTree()` (`useState`). Arrays still managed in sidebar; array nodes merge DOM hooks with DB children.

### 6. Edit flow

Click `[data-name]` → read element `data-type` → open matching editor → save to that typed column on the row identified by `data-name` + parent context.

## Consequences

- `FieldRow` loses `type`/`value`/`slice_id`; gains typed columns + `kind`.
- `resolveManifestFieldType`, schema registries' `fieldSchema`, and `usePageSlices` removed.
- Demo app uses fixed section components instead of slice CRUD.
- Migrations: 008 (wide columns + backfill), 009 (drop slices), 010 (drop legacy columns).

## References

- [content-model.md](./content-model.md)
- [vision.md](./vision.md)
- Migration: `packages/nuxt-cms/supabase/migrations/008_wide_field_columns.sql`
