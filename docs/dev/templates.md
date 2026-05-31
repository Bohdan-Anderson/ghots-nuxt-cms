# Templates

## Overview

A **template** is two things:

1. **Database** — `templates.key` + `field_schema` (what fields exist).
2. **Vue SFC** — consumer `app/templates/*.vue` (how they render).

In this repo, see **`demo/app/templates/`**.

They are linked by the **`key`** string (e.g. `default`).

## Registration

Consumer `app/composables/useTemplate.ts` (in this repo: `demo/app/composables/useTemplate.ts`):

```ts
const TEMPLATE_MAP: Record<string, Component> = {
  default: DefaultPage,
}
```

Re-exported via `app/cms/registries.ts` for the `#cms/registries` alias. `resolveTemplateComponent(templateKey)` returns the component or `null` (unknown template → error UI on the page).

### Adding a template

1. Insert row in **`templates`** with unique `key` and `field_schema`.
2. Create **`app/templates/YourPage.vue`** (or `demo/app/templates/YourPage.vue` in this repo).
3. Register in **`TEMPLATE_MAP`** and ensure `app/cms/registries.ts` re-exports `resolveTemplateComponent`.

## Default template (`DefaultPage.vue`)

Renders:

- **`title`** — root `plain_text` in `<h1 data-name="title" :data-id="...">`
- **`main`** — section wrapper
- **`body`** — `plain_text` under `main` in `<p data-name="body" ...>`

### `data-name` and `data-id`

Attributes support [modal editing](./inline-editing.md):

- `data-name` — field name for lookup.
- `data-id` — stable field UUID (preferred when resolving clicks).

Editable field types (plain_text, link, richtext, image) open the modal from page clicks when `loggedIn`.

## Props contract

Slice-demo and multi-slice templates receive additional props (`pageFields`, `slices`, `fieldsBySliceId`). Simple templates receive:

```ts
defineProps<{ fields: FieldRow[] }>()
```

They are responsible for resolving values via `resolveField` / local helpers — the parent does not pass individual field props.

## Dynamic rendering

`demo/app/pages/[...slug].vue` renders:

```vue
<component
  :is="templateComponent"
  :fields="content.fields"
  :page-fields="content.pageFields"
  :slices="content.slices"
  :fields-by-slice-id="content.fieldsBySliceId"
/>
```

inside `PageEditorProvider` when a template resolves.

## Schema ↔ markup alignment

The Vue template must match `field_schema` names and nesting. If the schema adds a field the SFC does not render, it won’t appear on the site until the template is updated.

If the SFC references a name not in the schema, seeded rows won’t exist unless created manually in Supabase.
