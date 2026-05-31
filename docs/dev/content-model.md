# Content model

See [ADR 002 — Content model v2](./adr-002-content-model-v2.md) for design decisions.

## Concepts (v2)

```text
Template (type)       Page (instance)           Content
─────────────────     ─────────────────         ─────────────────────────────
key: "slice-demo"     slug: "/demo"             Page fields: title
field_schema: [...]   meta_title, …             Slices: hero × 2 → headline each
                      template_id → …           Globals (site): nav_label
```

- **Template** — Vue SFC + page-level `field_schema` (fields outside slices).
- **Page** — URL + template + **meta** columns (`meta_title`, `meta_description`, `og_image`, `noindex`).
- **Slice type** — Code registry (`demo/app/slices/registry.ts`): component + field schema.
- **Slice instance** — Ordered row in `page_slices`; fields keyed by `slice_id`.
- **Global region** — Code registry (`demo/app/globals/registry.ts`); values in `globals` + `fields.global_id`.
- **Field** — Named node (`section`, `plain_text`, `link`, `richtext`) with optional `value`.

## Field schema (`field_schema`)

JSON array on `templates.field_schema` for **page-level** fields only. Slice schemas live in the code registry.

```ts
{
  name: string
  type: 'section' | 'plain_text' | 'link' | 'richtext'
  default?: string
  children?: FieldSchemaNode[]
}
```

## Field rows

Runtime content in `fields`:

| Owner | FK columns | Notes |
| ----- | ---------- | ----- |
| Page-level | `page_id`, `slice_id` null | From template `field_schema` |
| Slice instance | `page_id` + `slice_id` | Seeded when slice added |
| Global | `global_id`, `page_id` null | Seeded from global registry |

| `type` | `value` | Editable in UI |
| ------ | ------- | -------------- |
| `section` | `null` | No (container) |
| `plain_text` | string | Yes (modal) |
| `link` | JSON (`url`, `label`, `target`) | Yes (modal) |
| `richtext` | JSON (`source`, `html`) | Yes (modal) |

See [field-types.md](./field-types.md) for value shapes and sanitization.

Hierarchy within an owner: `parent_id` → section field `id`.

## `usePageContent(slug)`

`packages/nuxt-cms/app/composables/usePageContent.ts`:

1. Query `pages` with `templates(*)` by `slug`.
2. Load `page_slices` ordered by `sort_order`.
3. Load `fields` for `page_id`.
4. **If `loggedIn` and zero page-level fields** → seed from template schema → refetch.
5. Build `pageFields`, `fieldsBySliceId`, `fieldsById`, `fieldsByName`.
6. Return JSON-serializable `PageContent` for `useAsyncData` / `_payload.json`.

## `useGlobalData(key)`

`packages/nuxt-cms/app/composables/useGlobal.ts` — same caching pattern as page content. Loads `globals` row + fields; seeds from code registry when logged in and empty.

## Seeding

`seedFieldsFromSchema` (`packages/nuxt-cms/app/composables/seedFields.ts`) walks a schema tree for page-level, slice, or global context.

- **Page:** first logged-in visit with zero page-level fields.
- **Global:** first logged-in visit with zero fields for that global.
- **Slice:** `insertPageSlice()` in `usePageSlices.ts` on add (Phase 3 UI).

## Field lookup in templates

`resolveField(fields, name, parentSectionName?, sliceId?)`:

- No `sliceId` — page-level fields only.
- With `sliceId` — fields for that slice instance.

`demo/app/templates/DefaultPage.vue` — legacy flat page (home `/`).

`demo/app/templates/SliceDemoPage.vue` — page-level title + ordered slice stack (`/demo`).

## Updates

`updateFieldValue(fieldId, value)` — Supabase UPDATE; used by modal save + `patchField`.

## `PageContent` shape

```ts
{
  page: { id, slug, template_id, title, meta_title, meta_description, og_image, noindex, … }
  template: { id, key, label, field_schema }
  slices: PageSliceRow[]
  fields: FieldRow[]           // all page-owned rows
  pageFields: FieldRow[]        // slice_id null
  fieldsBySliceId: Record<string, FieldRow[]>
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>  // root page-level only
}
```

Stored under `useAsyncData` key `page:${slug}`. Globals under `global:${key}`.
