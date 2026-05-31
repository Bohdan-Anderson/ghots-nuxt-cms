# @ghots/nuxt-cms

Static-first Supabase page builder for Nuxt 4.

**Documentation:** [docs/README.md](../../docs/README.md) — getting started, templates, slices, field types, publishing, and examples.

## Quick install

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@ghots/nuxt-cms'], // or local path: '../packages/nuxt-cms'
})
```

See [Getting started](../../docs/getting-started.md) for the full setup.

## What you provide

- `app/cms/registries.ts` — template, slice, global resolvers
- Templates, slices, globals in Vue
- `[...slug].vue` and site chrome
- Supabase project + migrations from `supabase/migrations/`

## License

MIT
