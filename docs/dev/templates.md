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

### `data-name`, `data-type`, and `data-id`

Attributes support [modal editing](./inline-editing.md) and on-demand field sync:

- `data-name` — field name for lookup.
- `data-type` — field type (`plain_text`, `section`, `link`, `richtext`, `image`). Required for **new** fields not yet in `field_schema` or slice registry.
- `data-id` — stable field UUID (preferred when resolving clicks). Empty until the field row exists.

Editable field types (plain_text, link, richtext, image) open the modal from page clicks when `loggedIn`.

Example:

```vue
<h1
  data-name="title"
  data-type="plain_text"
  :data-id="field('title')?.id ?? ''"
>
  {{ field('title')?.value }}
</h1>

<section
  data-name="main"
  data-type="section"
  :data-id="field('main')?.id ?? ''"
>
  <p data-name="body" data-type="plain_text" :data-id="field('body', 'main')?.id ?? ''">
    {{ field('body', 'main')?.value }}
  </p>
</section>
```

## On-demand field sync (editors only)

When a logged-in editor loads a page, `PageEditorProvider` scans rendered markup for `[data-name]` elements and ensures matching rows exist in the `fields` table:

1. **Missing field** — inserts a row (creates parent `section` rows first when nested).
2. **Type mismatch** — updates `type` and coerces `value` without wiping content (e.g. `plain_text` → `richtext` wraps existing text as markdown source).
3. **Malformed JSON** — repairs structured values (`link`, `richtext`, `image`) in place.

Guests never trigger writes. Orphan DB fields not referenced in markup are left unchanged.

**Type resolution** when `data-type` is omitted:

1. `data-type` attribute on the element
2. Slice registry (`getSliceDefinition`) for fields inside `[data-slice-type]`
3. Template `field_schema` for page-level fields
4. Default `plain_text`

**Limits:**

- Array item fields (e.g. team member `name` inside `members`) are not auto-created from markup — use the sidebar add-item flow.
- Structural type changes (`section` ↔ leaf) are skipped when child rows exist.

Implementation: [`collectFieldManifest.ts`](../../packages/nuxt-cms/app/fields/collectFieldManifest.ts), [`ensureField.ts`](../../packages/nuxt-cms/app/fields/ensureField.ts), [`PageEditorProvider.vue`](../../packages/nuxt-cms/app/components/PageEditorProvider.vue).

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

The Vue template must match `field_schema` names and nesting for **new page seeding** and array schema lookup. For **existing pages**, logged-in editors can add new fields in markup with `data-name` + `data-type` — rows are created on load without a migration.

If the schema adds a field the SFC does not render, it won’t appear on the site until the template is updated.
