# Minimal consumer example

Runnable smoke-test app: extends `ghots-nuxt-cms` and renders one editable home page.

For slices, globals, and E2E see [`demo/`](../../demo/).

## Quick start

```bash
# From repo root
npm install
cp examples/minimal/.env.example examples/minimal/.env
# Apply packages/nuxt-cms/supabase/migrations/ and create an Auth user
npm run dev:minimal
```

Open http://localhost:3000 — log in at `/login` to edit the home page title.

## Layout

| Path | Purpose |
| ---- | ------- |
| `app/cms/registries.ts` | Required registry barrel |
| `app/composables/useTemplate.ts` | Template key → Vue SFC |
| `app/templates/DefaultPage.vue` | Single-field home layout |
| `app/pages/[...slug].vue` | Catch-all + `useCmsPage()` |
| `app/app.vue` | Sidebar + `<NuxtPage />` |
| `app/slices/registry.ts` | Empty stub (no slices) |
| `app/globals/registry.ts` | Empty stub (no globals) |

Paths above are under `examples/minimal/app/` in this repo; in your own Nuxt project they live under `app/`.

## nuxt.config.ts

```ts
export default defineNuxtConfig({
  extends: ['../../packages/nuxt-cms'], // or 'ghots-nuxt-cms' from npm

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      cmsSiteKey: process.env.CMS_SITE_KEY ?? 'minimal',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
```

See [Getting started](../../docs/getting-started.md) for migrations and Supabase setup.
