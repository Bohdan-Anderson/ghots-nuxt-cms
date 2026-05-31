# Templates

A **template** is a Vue page layout plus a **page-level field schema**. Every CMS page points at one template.

> **This monorepo:** working examples live under [`demo/app/templates/`](../demo/app/templates/). Paths below use `app/` relative to your Nuxt project root.

## Concepts

```text
Template (code + DB row)     Page (DB)
────────────────────────     ─────────
key: "default"          →    slug: "/about"
Vue: DefaultPage.vue         uses template "default"
field_schema: [title, …]     field values in `fields` table
```

Page-level fields belong to the page root — not inside a slice. Use them for titles, hero text above a slice stack, or SEO-related content you render in the template.

## 1. Define the schema

In Supabase, each template has a `field_schema` JSON array:

```json
[
  { "name": "title", "type": "plain_text", "default": "Welcome" },
  { "name": "intro", "type": "richtext", "default": "Short **intro**." }
]
```

Insert via SQL or seed script:

```sql
insert into templates (key, label, field_schema)
values (
  'default',
  'Default page',
  '[{"name":"title","type":"plain_text","default":""}]'::jsonb
);
```

Field types must match what the CMS supports — see [Field types](./field-types.md).

## 2. Map key → Vue component

```ts
// app/composables/useTemplate.ts
import DefaultPage from '~/templates/DefaultPage.vue'
import LandingPage from '~/templates/LandingPage.vue'

const TEMPLATE_MAP = {
  default: DefaultPage,
  landing: LandingPage,
}

export function resolveTemplateComponent(key: string) {
  return TEMPLATE_MAP[key] ?? null
}
```

Register the resolver in `app/cms/registries.ts` (see [Getting started](./getting-started.md)).

## 3. Build the Vue template

Templates receive props from `[...slug].vue`:

| Prop | Contents |
| ---- | -------- |
| `pageFields` | Fields scoped to the page (no slice) |
| `fields` | All fields on the page |
| `slices` | Ordered slice instances |
| `fieldsBySliceId` | Fields grouped by slice instance |

Minimal page-only template:

```vue
<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{
  pageFields: FieldRow[]
}>()

function field(name: string) {
  return resolveField(props.pageFields, name)
}
</script>

<template>
  <article>
    <h1 :data-name="field('title')?.name">{{ field('title')?.value }}</h1>
    <CmsRichText
      v-if="field('intro')"
      :field="field('intro')!"
      data-name="intro"
    />
  </article>
</template>
```

Template with a slice stack:

```vue
<script setup lang="ts">
import type { FieldRow, PageSliceRow } from '~/types/cms'
import { resolveSliceComponent } from '~/slices/registry'

const props = defineProps<{
  pageFields: FieldRow[]
  slices: PageSliceRow[]
  fieldsBySliceId: Record<string, FieldRow[]>
}>()
</script>

<template>
  <div>
    <h1 :data-name="'title'">{{ resolveField(pageFields, 'title')?.value }}</h1>

    <component
      v-for="slice in slices"
      :key="slice.id"
      :is="resolveSliceComponent(slice.slice_type_key)"
      :slice-id="slice.id"
      :fields="fieldsBySliceId[slice.id] ?? []"
    />
  </div>
</template>
```

## 4. Create pages

```sql
insert into pages (slug, title, template_id, meta_title)
select '/about', 'About us', id, 'About — My Site'
from templates where key = 'default';
```

Or use the sidebar **Pages** tab after your app is running.

## 5. Prerender

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
- **Keep templates thin** — repeated sections belong in [slices](./slices.md), not duplicated templates.
- **`data-name`** — must match the field `name` for click-to-edit. Use helper components (`CmsRichText`, `CmsLink`, `CmsImage`) where they fit.

## Next

- [Slices](./slices.md) — sections inside a template
- [Field types](./field-types.md) — schema reference
