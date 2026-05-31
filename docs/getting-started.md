# Getting started

Get from zero to one editable page. About 30 minutes if you already have a Supabase project.

Paths below use **`app/`** relative to your Nuxt project root (the consumer app). In this monorepo, the working reference lives under **`demo/app/`**.

## What you need

- Node.js (LTS)
- A [Supabase](https://supabase.com) project
- A Nuxt 4 app (or create one below)

## 1. Install the CMS layer

### Option A — from this repo (today)

Clone or copy `packages/nuxt-cms` into your project, then extend it:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['../packages/nuxt-cms'], // adjust path to the layer
})
```

### Option B — npm (when published)

```bash
npm install @ghots/nuxt-cms @supabase/supabase-js
```

```ts
export default defineNuxtConfig({
  extends: ['@ghots/nuxt-cms'],
})
```

Use whichever matches how you obtained the package. The rest of this guide is the same.

## 2. Configure Supabase

See **[Supabase setup](./supabase.md)** — apply migrations, set env vars, create an Auth user for editing.

```env
# .env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@ghots/nuxt-cms'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'], // every public URL you want in the static build
    },
  },
})
```

## 3. Wire registries

Create **`app/cms/registries.ts`** — the CMS reads template, slice, and global definitions from here:

```ts
export { resolveTemplateComponent } from '~/composables/useTemplate'
export {
  getSliceDefinition,
  listSliceDefinitions,
  resolveSliceComponent,
} from '~/slices/registry'
export {
  getGlobalDefinition,
  listGlobalDefinitions,
} from '~/globals/registry'
```

You will add those files in the next steps (start with templates only if you want the smallest possible setup).

## 4. Add one template

**Database** — insert a template row (Supabase SQL editor or Table Editor):

```sql
insert into templates (key, label, field_schema)
values (
  'default',
  'Default page',
  '[{"name": "title", "type": "plain_text", "default": "Hello"}]'::jsonb
);
```

**Code** — map the key to a Vue component:

```ts
// app/composables/useTemplate.ts
import DefaultPage from '~/templates/DefaultPage.vue'

const TEMPLATE_MAP = { default: DefaultPage }

export function resolveTemplateComponent(key: string) {
  return TEMPLATE_MAP[key] ?? null
}
```

```vue
<!-- app/templates/DefaultPage.vue -->
<script setup lang="ts">
import type { FieldRow } from '~/types/cms'

const props = defineProps<{ fields: FieldRow[] }>()

function field(name: string) {
  return resolveField(props.fields, name)
}
</script>

<template>
  <main>
    <h1 :data-name="field('title')?.name">{{ field('title')?.value }}</h1>
  </main>
</template>
```

`resolveField` is auto-imported from the CMS layer. `data-name` lets logged-in editors click the heading to open the edit modal.

**Database** — create a page that uses the template:

```sql
insert into pages (slug, title, template_id)
select '/', 'Home', id from templates where key = 'default';
```

Field rows are seeded automatically when an editor first loads the page (or on first logged-in visit).

## 5. Add the catch-all page

```vue
<!-- app/pages/[...slug].vue -->
<script setup lang="ts">
const { content, status, templateComponent, patchField, loggedIn } = useCmsPage()
</script>

<template>
  <div v-if="status === 'pending'">Loading…</div>
  <div v-else-if="!content"><h1>404</h1></div>

  <PageEditorProvider
    v-else-if="templateComponent"
    :enabled="loggedIn"
    :fields="content.fields"
    :fields-by-id="content.fieldsById"
    :fields-by-name="content.fieldsByName"
    @field-updated="patchField"
  >
    <component
      :is="templateComponent"
      :fields="content.fields"
      :page-fields="content.pageFields"
      :slices="content.slices"
      :fields-by-slice-id="content.fieldsBySliceId"
    />
  </PageEditorProvider>
</template>
```

Add your own nav, `<head>` meta, and layout chrome in this file — that is site-specific, not part of the package.

## 6. App shell

```vue
<!-- app/app.vue -->
<template>
  <CmsSidebar v-if="loggedIn" />
  <NuxtPage />
</template>
```

The package includes `/login` and editor styles. Editors sign in there to get the sidebar.

## 7. Run and edit

```bash
npm run dev
```

Open `/`, go to `/login`, sign in, click the heading, edit, save. Changes persist in Supabase immediately.

## 8. Publish for guests

```bash
npm run generate
```

Deploy the `dist/` folder to any static host. Guests see this build until you generate again. Details: **[Publishing](./publishing.md)**.

## Next steps

| Goal | Read |
| ---- | ---- |
| Add reusable sections | [Slices](./slices.md) |
| Shared nav / footer | [Globals](./globals.md) |
| More field types | [Field types](./field-types.md) |
| Blog-style content | [Blog example](./examples/blog.md) |
| Existing Nuxt site | [Adopting an existing site](./adopting-an-existing-site.md) |
