# Content model

## Concepts

```text
Template (type)     Page (instance)        Fields (values)
─────────────────   ─────────────────      ─────────────────
key: "default"      slug: "/about"         title: "About us"
field_schema: [...]  template_id → ...      main (section)
                                            └── body: "..."
```

- **Template** — Reusable structure: JSON schema + Vue component.
- **Page** — A URL on the site bound to one template.
- **Field** — A named node (`section` or `plain_text`) with an optional `value`.

## Field schema (`field_schema`)

JSON array on `templates.field_schema`. Type: `FieldSchemaNode` in `app/types/cms.ts`.

```ts
{
  name: string
  type: 'section' | 'plain_text'
  default?: string
  children?: FieldSchemaNode[]
}
```

Example (default template):

```json
[
  { "name": "title", "type": "plain_text", "default": "" },
  {
    "name": "main",
    "type": "section",
    "children": [{ "name": "body", "type": "plain_text", "default": "" }]
  }
]
```

## Field rows

Runtime content in `fields`:

| `type` | `value` | Editable in UI |
| ------ | ------- | -------------- |
| `section` | `null` | No (container) |
| `plain_text` | string | Yes (modal) |

Hierarchy: `parent_id` → section field `id`. Root fields have `parent_id = null`.

Unique per page: `(page_id, parent_id, name)`.

## `usePageContent(slug)`

`app/composables/usePageContent.ts`:

1. Query `pages` with `templates(*)` by `slug`.
2. Missing row → `null` (404 UI).
3. Load `fields` ordered by `sort_order`.
4. **If `loggedIn` and zero fields** → `seedFieldsFromSchema()` then refetch.
5. Build `fieldsById` and `fieldsByName` (root names only in `fieldsByName`).
6. Return **`toPageContentPayload()`** — plain JSON for `useAsyncData` / `_payload.json`.

Guests on a static deploy should receive this payload from cache, not a live fetch (see [Static generation](./static-generation.md)).

## Seeding

`seedFieldsFromSchema` walks `field_schema` recursively:

- INSERT each node.
- `plain_text` `value` from `default` or `''`.
- `children` under inserted section IDs.

Runs only when **`loggedIn`** and the page has **zero** fields.

## Field lookup in templates

`resolveField(fields, name, parentSectionName?)`:

- No parent — root field by `name`.
- With parent — root section by name, then child by `name` + `parent_id`.

`DefaultPage.vue` exposes a local `field(name, parentSectionName?)` helper.

## Updates

`updateFieldValue(fieldId, value)` — Supabase UPDATE; returns updated row.

Used by `usePageEditor.save()`; parent patches via `onFieldUpdated` in `[...slug].vue`.

## `PageContent` shape

```ts
{
  page: { id, slug, template_id, title, created_at, updated_at }
  template: { id, key, label, field_schema }
  fields: FieldRow[]
  fieldsById: Record<string, FieldRow>
  fieldsByName: Record<string, FieldRow>  // root-level only
}
```

Stored under `useAsyncData` key `page:${slug}` (e.g. `page:/`, `page:/about`).
