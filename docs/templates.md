# Templates

## Overview

A **template** is two things:

1. **Database** — `templates.key` + `field_schema` (what fields exist).
2. **Vue SFC** — `app/templates/*.vue` (how they render).

They are linked by the **`key`** string (e.g. `default`).

## Registration

`app/composables/useTemplate.ts`:

```ts
const TEMPLATE_MAP: Record<string, Component> = {
  default: DefaultPage,
}
```

`resolveTemplateComponent(templateKey)` returns the component or `null` (unknown template → error UI on the page).

### Adding a template

1. Insert row in **`templates`** with unique `key` and `field_schema`.
2. Create **`app/templates/YourPage.vue`**.
3. Register in **`TEMPLATE_MAP`**.

## Default template (`DefaultPage.vue`)

Renders:

- **`title`** — root `plain_text` in `<h1 data-name="title" :data-id="...">`
- **`main`** — section wrapper
- **`body`** — `plain_text` under `main` in `<p data-name="body" ...>`

### `data-name` and `data-id`

Attributes support [modal editing](./inline-editing.md):

- `data-name` — field name for lookup.
- `data-id` — stable field UUID (preferred when resolving clicks).

Sections get `data-id` but are not editable (only `plain_text` opens the modal).

## Props contract

Template components receive:

```ts
defineProps<{ fields: FieldRow[] }>()
```

They are responsible for resolving values via `resolveField` / local helpers — the parent does not pass individual field props.

## Dynamic rendering

`[...slug].vue` renders:

```vue
<component :is="templateComponent" :fields="content.fields" />
```

inside `PageEditorProvider` when a template resolves.

## Schema ↔ markup alignment

The Vue template must match `field_schema` names and nesting. If the schema adds a field the SFC does not render, it won’t appear on the site until the template is updated.

If the SFC references a name not in the schema, seeded rows won’t exist unless created manually in Supabase.
