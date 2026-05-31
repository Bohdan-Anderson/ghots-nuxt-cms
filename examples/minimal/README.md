# Minimal consumer example

Smoke-test scaffold for Phase 7: a fresh Nuxt app that extends `@ghots/nuxt-cms` and renders one editable page.

**Status:** scaffold only — see [`demo/`](../demo/) for a full working reference app.

## Checklist (&lt; 30 min target)

1. Copy this folder to a new Nuxt 4 project (or add as `examples/minimal` workspace)
2. `npm install` with `@ghots/nuxt-cms` + `@supabase/supabase-js`
3. Apply migrations from `packages/nuxt-cms/supabase/migrations/`
4. Set `VITE_SUPABASE_*` env vars
5. Create Supabase Auth user for login
6. `npm run dev` → `/` renders home page
7. Log in → sidebar opens → edit title → save persists
8. `npm run generate` → static guest sees published content

## Files to copy from reference app

| File | Purpose |
| ---- | ------- |
| `app/cms/registries.ts` | Registry barrel |
| `app/composables/useTemplate.ts` | Template map |
| `app/templates/DefaultPage.vue` | Minimal template |
| `app/pages/[...slug].vue` | Page shell (strip demo nav if desired) |
| `app/app.vue` | Sidebar + NuxtPage |

Optional: `app/slices/`, `app/globals/` when you need slices or shared regions.

## nuxt.config.ts

```ts
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
      routes: ['/'],
    },
  },
})
```

See [Getting started](../../docs/getting-started.md) for full setup steps.
