# ADR 002 — Content model v2 (slices, page fields, meta, globals)

**Status:** Accepted  
**Date:** 2025-05-24  
**Phase:** 2

## Context

Phase 1 locked in editor reliability and zero Supabase for guests. The v1 schema (`templates.field_schema` → flat `fields` tree per page) cannot express:

- Reusable **slice** sections added/removed/reordered per page
- **Page-level fields** distinct from slice content
- **Page meta** for `<head>` (SEO, OG)
- **Global regions** (nav label, footer) shared across pages

Phase 3 sidebar and Phase 4 field types depend on this model.

## Decisions

### 1. Slice storage — `page_slices` table + fields keyed by `slice_id`

**Choice:** Normalized `page_slices` rows (ordered instances) + existing `fields` table extended with `slice_id`.

**Alternatives considered:**

| Option | Pros | Cons |
| ------ | ---- | ---- |
| JSON document per page | Fewer joins | Hard to query/update single field; poor fit for modal save pipeline |
| **`page_slices` + `fields.slice_id`** | Matches current field rows; cascade delete; E2E-friendly | More tables |

Slice **types** (Vue component + field schema) live in **code only** (`app/slices/registry.ts`), not in DB. DB stores instance rows with `slice_type_key` text.

### 2. Page-level fields — same `fields` table, `slice_id IS NULL`

Template `field_schema` defines page-level shape (unchanged column name for backward compatibility). Runtime rows have `page_id` set, `slice_id` and `global_id` null.

Nested sections within a page-level field tree still use `parent_id` as today.

### 3. Page meta — columns on `pages`

**Choice:** `meta_title`, `meta_description`, `og_image`, `noindex` columns on `pages`.

**Alternative:** `meta jsonb` — deferred; explicit columns are enough for v1 and easier to index/display in sidebar later.

Existing `title` remains the internal/nav label. `meta_title` falls back to `title` in templates/`useHead`.

### 4. Global storage — `globals` table + `fields.global_id`

**Choice:** `globals(key, label)` + fields with `global_id` ( `page_id` null).

**Alternatives considered:**

| Option | Pros | Cons |
| ------ | ---- | ---- |
| Pseudo-pages (`/_global/nav`) | Reuses page loader | Confusing slug routing; pollutes page list |
| **`globals` + `fields.global_id`** | Clear ownership; same field/save pipeline | Nullable `page_id` on fields |

Global **definitions** (schema) live in code (`app/globals/registry.ts`); DB holds values only.

### 5. Field ownership constraint

Each `fields` row belongs to exactly one owner:

- **Page-level:** `page_id` set, `slice_id` null, `global_id` null
- **Slice instance:** `page_id` + `slice_id` set, `global_id` null
- **Global:** `global_id` set, `page_id` null

Partial unique indexes:

- `(page_id, slice_id, parent_id, name)` where `page_id is not null`
- `(global_id, parent_id, name)` where `global_id is not null`

### 6. Seed-on-add (app layer)

Inserting a slice instance or visiting a global/page with zero fields while logged in seeds rows from the code registry schema (same pattern as Phase 0 `seedFieldsFromSchema`). Delete slice instance → `ON DELETE CASCADE` removes `page_slices` row and slice fields.

### 7. Migration path for existing data

Migration 002 is **additive**. Home page `/` fields unchanged (`slice_id` / `global_id` null). No data rewrite required.

New seed data:

- Global `site` with `nav_label`
- Demo page `/demo` with template `slice-demo`, two `hero` slices, page-level `title`

E2E continues to use `/` only.

## Consequences

- `PageContent` gains `slices`, `pageFields`, `fieldsBySliceId`; `PageRow` gains meta columns.
- `useGlobal(key)` mirrors `usePageContent` caching for guests.
- Templates resolve slice components via `resolveSliceComponent(typeKey)`.
- Phase 3 adds sidebar CRUD for slices/pages/meta; Phase 4 extends field types on the same rows.

## References

- [vision.md](./vision.md) — product concepts
- [content-model.md](./content-model.md) — updated for v2
- [database.md](./database.md) — table reference
- Migration: [`supabase/migrations/002_slices_meta_globals.sql`](../supabase/migrations/002_slices_meta_globals.sql)
