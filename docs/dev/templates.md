# Templates

## Overview

A **template** is two things:

1. **Database** — `templates.key` (links a page to a layout).
2. **Vue SFC** — consumer `app/templates/*.vue` (structure + field markup).

In this repo, see **`demo/app/templates/`**.

They are linked by the **`key`** string (e.g. `default`). Field structure is declared in Vue via `data-name` / `data-type` / `data-id` — not in `field_schema` (deprecated, empty).

## Registration

Consumer `app/composables/useTemplate.ts` (in this repo: `demo/app/composables/useTemplate.ts`):

```ts
const TEMPLATE_MAP: Record<string, Component> = {
  default: DefaultPage,
  'sections-demo': SectionsDemoPage,
}
```

Re-exported via `app/cms/registries.ts` for the `#cms/registries` alias. `resolveTemplateComponent(templateKey)` returns the component or `null` (unknown template → error UI on the page).

### Adding a template

1. Insert row in **`templates`** with unique `key` and empty `field_schema`.
2. Create **`app/templates/YourPage.vue`** with DOM markup (see [DOM markup](../dom-markup.md)).
3. Register in **`TEMPLATE_MAP`** and ensure `app/cms/registries.ts` re-exports `resolveTemplateComponent`.

## Default template (`DefaultPage.vue`)

Renders page-level fields and a nested section:

- **`title`** — `data-type="plain_text"` in `<h1>`
- **`main`** — `data-type="section"` wrapper
- **`body`** — `plain_text` under `main`

Example:

```vue
<article data-type="page" :data-id="pageId">
  <h1
    data-name="title"
    data-type="plain_text"
    :data-id="field('title').id"
  >
    {{ cmsColumnValue(field('title'), 'plain_text') }}
  </h1>

  <section
    data-name="main"
    data-type="section"
    :data-id="field('main').id"
  >
    <p
      data-name="body"
      data-type="plain_text"
      :data-id="field('body', field('main').id || null).id"
    >
      {{ cmsColumnValue(field('body', field('main').id || null), 'plain_text') }}
    </p>
  </section>
</article>
```

Use `useCmsField(fieldsByParentAndName, parentId, name)` for lookups.

## On-demand field ensure (editors only)

When a logged-in editor loads a page, `PageEditorProvider` runs `syncFieldsFromDom`:

1. Collects `[data-name]` elements without valid `data-id`.
2. Sorts shallowest-first by DOM depth.
3. Calls `ensureField(parentId, name)` for each — creates empty rows in typed columns implied by `data-type`.

Guests never trigger writes. Orphan DB rows not referenced in markup are left unchanged.

**Type resolution:** `data-type` on the element is authoritative. No schema fallback.

Implementation: [`syncFieldsFromDom.ts`](../../packages/nuxt-cms/app/fields/syncFieldsFromDom.ts), [`ensureField.ts`](../../packages/nuxt-cms/app/fields/ensureField.ts), [`PageEditorProvider.vue`](../../packages/nuxt-cms/app/components/PageEditorProvider.vue).

## Props contract

Templates receive from `[...slug].vue`:

```ts
defineProps<{
  pageId: string
  fields: FieldRow[]
  fieldsByParentAndName: Record<string, FieldRow>
}>()
```

Section components typically also take `sectionName` and use the same `fieldsByParentAndName` map.

## Dynamic rendering

`demo/app/pages/[...slug].vue` renders:

```vue
<component
  :is="templateComponent"
  :page-id="content.page.id"
  :fields="content.fields"
  :fields-by-parent-and-name="content.fieldsByParentAndName"
/>
```

inside `PageEditorProvider` when a template resolves.

## Markup ↔ database

The Vue template is the source of truth. Adding a new `data-name` + `data-type` in markup creates the row on the next editor visit — no migration required. Removing markup does not delete orphan DB rows.

## Section stacks

Multi-section pages compose fixed section components (see `SectionsDemoPage.vue` + `demo/app/sections/`). This replaced editor-managed slice instances (ADR 003).
