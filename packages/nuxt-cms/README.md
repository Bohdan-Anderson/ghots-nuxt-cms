# ghots-nuxt-cms

Static-first Supabase page builder for [Nuxt 4](https://nuxt.com).

Developers define **templates**, **slices**, and **globals** in Vue. Editors change content on the live site (sidebar + modal). Guests get fast prerendered HTML from your last `nuxt generate` — no runtime database calls.

## How it works

| Audience | What they see |
| -------- | ------------- |
| **Guest** | Last published static build (`dist/`) |
| **Logged-in editor** | Live Supabase data; edits save immediately |
| **You (developer)** | Templates, slices, field schemas in code |

**Publish** = run `nuxt generate` and deploy `dist/` so guests catch up with editor changes.

## Requirements

- Node.js 20+
- Nuxt 4
- A [Supabase](https://supabase.com) project (Postgres, Auth, Storage)

## Install

```bash
npm install ghots-nuxt-cms @supabase/supabase-js
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['ghots-nuxt-cms'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      cmsSiteKey: process.env.CMS_SITE_KEY ?? 'demo',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'], // every public URL in your static build
    },
  },
})
```

```env
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
CMS_SITE_KEY=demo
```

`CMS_SITE_KEY` must match a row in the `sites` table (see migrations below).

## Supabase setup

1. Apply SQL migrations from **`node_modules/ghots-nuxt-cms/supabase/migrations/`** in order (`001` → `007`).
2. Create an email/password user in Supabase Auth for editors.
3. Grant site access:

```sql
insert into site_members (site_id, user_id)
select s.id, 'USER-UUID-HERE'
from sites s
where s.key = 'demo';
```

**Note:** Migration `007` enables multi-site support and re-seeds demo sites. Read the migration before applying on an existing database.

Tables, RLS, and storage are documented in the [ghots-nuxt-cms repo](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs).

## What you provide

The layer ships editor UI, composables, auth, and DB schema. Your app provides content definitions and site chrome:

| File / folder | Purpose |
| ------------- | ------- |
| `app/cms/registries.ts` | **Required** — exports template, slice, and global resolvers |
| `app/composables/useTemplate.ts` | Maps DB template keys → Vue SFCs |
| `app/templates/*.vue` | Page layouts with CMS fields |
| `app/slices/registry.ts` | Slice components + field schemas (optional) |
| `app/globals/registry.ts` | Shared nav/footer/settings (optional) |
| `app/pages/[...slug].vue` | Catch-all page using `useCmsPage()` |
| `app/app.vue` | Site shell + `<CmsSidebar v-if="loggedIn" />` |

### Registries barrel

```ts
// app/cms/registries.ts
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

### Minimal template

```sql
insert into templates (key, label, field_schema)
values (
  'default',
  'Default page',
  '[{"name": "title", "type": "plain_text", "default": "Hello"}]'::jsonb
);

insert into pages (slug, title, template_id)
select '/', 'Home', id from templates where key = 'default';
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

`resolveField` is auto-imported from the layer. `data-name` lets editors click the heading to open the edit modal.

### Catch-all page

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

## Run and publish

```bash
npm run dev          # editors: live Supabase at /login
npm run generate     # bake static site → dist/
```

Deploy `dist/` to any static host. Do **not** use `npm run dev` to test guest behavior — dev always hits Supabase.

## Field types

Built-in types: `plain_text`, `link`, `richtext`, `image`, `array`.

Use `<CmsLink>`, `<CmsRichText>`, `<CmsImage>` in templates. See the repo docs for slice arrays, globals, and publishing workflows.

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `CMS_SITE_KEY` | Yes | Site key for this deployment (`sites.key`) |
| `CMS_PUBLISH_WEBHOOK_URL` | No | Future CI hook placeholder (not called in v1) |

## Documentation

Full guides (templates, slices, globals, publishing, examples):

**[github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/docs)**

Reference apps in that repo:

- [`demo/`](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/demo) — full-featured example + E2E
- [`examples/minimal/`](https://github.com/Bohdan-Anderson/ghots-nuxt-cms/tree/main/examples/minimal) — smallest working install

## License

MIT
