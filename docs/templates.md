# Templates

A **template** is a Vue page layout. Every CMS page points at one template by key. Structure and fields are declared in markup — see **[DOM markup](./dom-markup.md)** for the full attribute reference.

> **This monorepo:** working examples live under [`demo/app/templates/`](../demo/app/templates/). Paths below use `app/` relative to your Nuxt project root.

## Concepts

```text
Template (Vue SFC)          Page (DB)
──────────────────          ─────────
key: "default"         →    slug: "/about"
DefaultPage.vue             field rows created from DOM on first edit
```

Page-level fields sit directly under the `data-type="page"` root. Reusable blocks are developer-placed **section components** (`app/sections/*.vue`), not editor-added slice instances.

## 1. Register in the database

Insert a template row with a unique key. `field_schema` is deprecated — use an empty array:

```sql
insert into templates (key, label, field_schema)
values ('default', 'Default page', '[]'::jsonb);
```

## 2. Map key → Vue component

```ts
// app/composables/useTemplate.ts
import DefaultPage from '~/templates/DefaultPage.vue'
import SectionsDemoPage from '~/templates/SectionsDemoPage.vue'

const TEMPLATE_MAP = {
  default: DefaultPage,
  'sections-demo': SectionsDemoPage,
}

export function resolveTemplateComponent(key: string) {
  return TEMPLATE_MAP[key] ?? null
}
```

Register the resolver in `app/cms/registries.ts` (see [Getting started](./getting-started.md)).

## 3. Build the Vue template

Templates receive props from `[...slug].vue`:

| Prop                    | Contents                                      |
| ----------------------- | --------------------------------------------- |
| `pageId`                | Page UUID for `data-type="page"`              |
| `fields`                | All field rows on the page                    |
| `fieldsByParentAndName`   | Lookup map for `useCmsField(parentId, name)`    |

Minimal page-only template:

```vue
<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  pageId: string
  fieldsByParentAndName: Record<string, FieldRow>
}>()

const titleField = computed(() =>
  useCmsField(props.fieldsByParentAndName, null, 'title'),
)
</script>

<template>
  <article data-type="page" :data-id="pageId">
    <h1
      data-name="title"
      data-type="plain_text"
      :data-id="titleField.id"
    >
      {{ cmsColumnValue(titleField, 'plain_text') }}
    </h1>
  </article>
</template>
```

Template with nested section and a section stack:

```vue
<template>
  <article data-type="page" :data-id="pageId">
    <h1 data-name="title" data-type="plain_text" :data-id="titleField.id">
      {{ cmsColumnValue(titleField, 'plain_text') }}
    </h1>

    <section
      data-name="main"
      data-type="section"
      :data-id="mainSection.id"
    >
      <p
        data-name="body"
        data-type="plain_text"
        :data-id="bodyField.id"
      >
        {{ cmsColumnValue(bodyField, 'plain_text') }}
      </p>
    </section>

    <HeroSection
      section-name="hero1"
      :fields-by-parent-and-name="fieldsByParentAndName"
    />
  </article>
</template>
```

See [`demo/app/templates/DefaultPage.vue`](../demo/app/templates/DefaultPage.vue) and [`SectionsDemoPage.vue`](../demo/app/templates/SectionsDemoPage.vue).

## 4. Wire the catch-all page

```vue
<PageEditorProvider
  :enabled="loggedIn"
  :fields-by-id="content.fieldsById"
  :fields-by-parent-and-name="content.fieldsByParentAndName"
  @field-updated="patchField"
>
  <component
    :is="templateComponent"
    :page-id="content.page.id"
    :fields="content.fields"
    :fields-by-parent-and-name="content.fieldsByParentAndName"
  />
</PageEditorProvider>
```

## 5. Create pages

```sql
insert into pages (slug, title, template_id, meta_title)
select '/about', 'About us', id, 'About — My Site'
from templates where key = 'default';
```

Or use the sidebar **Pages** tab after your app is running.

## 6. Prerender

Add each public slug to `nuxt.config.ts`:

```ts
nitro: {
  prerender: {
    routes: ['/', '/about'],
  },
},
```

Or enable `crawlLinks: true` if your nav links to all public pages.

## Tips

- **One template, many pages** — same layout, different field values per slug.
- **Keep templates thin** — repeated UI belongs in `app/sections/`, not copy-pasted markup.
- **Tag every CMS node** — `data-name`, `data-type`, `:data-id` on page root, sections, and leaves. Use `<CmsRichText>`, `<CmsLink>`, `<CmsImage>` where they fit.
- **Unique section names** — when placing the same section component twice, pass distinct `section-name` props (`hero1`, `hero2`).

## Next

- [DOM markup](./dom-markup.md) — attribute reference and patterns
- [Field types](./field-types.md) — leaf types and columns
- [Globals](./globals.md) — shared nav and footer
