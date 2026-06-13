# Content model

See [ADR 003 — DOM-first content model](./adr-003-dom-first-content-model.md) for design decisions.

## Concepts (v3)

```text
Template (Vue SFC)     Page (instance)           Content
─────────────────     ─────────────────         ─────────────────────────────
key: "sections-demo"  slug: "/demo"             Page fields + sections in DOM
                      meta_title, …             Globals (site): nav_label
```

- **Template** — Vue SFC; structure declared in markup (`data-name`, `data-type`, sections).
- **Page** — URL + template + **meta** columns.
- **Section** — Developer-placed Vue section component with `data-type="section"`.
- **Global region** — `data-global="key"` wrapper; values in `globals` + `fields.global_id`.
- **Field row** — Named slot under a parent with typed value columns (`plain_text`, `richtext`, `link`, `image`).

## Field rows (wide model)

| Column       | Purpose                                                          |
| ------------ | ---------------------------------------------------------------- |
| `plain_text` | Plain string                                                     |
| `richtext`   | JSON (`source`, `html`)                                          |
| `link`       | JSON (`url`, `label`, `target`)                                  |
| `image`      | JSON (`url`, `alt`)                                              |
| `kind`       | `section` or `array` for structural rows; null for content slots |

Hierarchy: `parent_id` links children to section/array containers.

## DOM contract

| Attribute             | Purpose                           |
| --------------------- | --------------------------------- |
| `data-type="page"`    | Page root; `data-id` = page UUID  |
| `data-type="section"` | Section container                 |
| `data-type="array"`   | Repeatable hook (sidebar-managed) |
| `data-global="key"`   | Global region scope               |
| `data-name`           | Row key within parent             |
| `data-type` (leaf)    | Editor UI column                  |
| `data-id`             | Stable UUID after ensure          |

## Lazy ensure

Logged-in editors: `ensureField(parentId, name)` creates empty rows from rendered DOM on page load and click. No `field_schema` seeding.

Templates use `useCmsField(fieldsByParentAndName, parentId, name)` and `cmsColumnValue(field, column)`.

## Sidebar tree

Built from DOM via `scanContentTree` → `useContentTree()` store after render.

## `usePageContent(slug)`

1. Query `pages` with `templates(*)`.
2. Load `fields` for `page_id`.
3. Build `fieldsById`, `fieldsByName`, `fieldsByParentAndName`.

## Updates

`updateFieldColumn(fieldId, column, value)` — Supabase UPDATE on the typed column.
