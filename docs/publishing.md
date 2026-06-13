# Publishing

Editors see **live** Supabase data. Guests see the last **static build**. Publishing means regenerating that build and deploying it.

## The model

```text
Editor saves field     →  Supabase updated immediately
Guest on static site   →  Still old HTML until you generate + deploy
```

There is no auto-rebuild on save in v1. You control when guests update.

## How to publish

### Local

```bash
npm run generate
# or
npm run publish:static
```

Output goes to `dist/` (configurable via Nitro). Upload to your static host — Cloudflare Pages, Netlify, S3, etc.

### From the CMS UI

When logged in, open the sidebar **Publish** panel. It shows the command to run (`npm run publish:static`) and copy-to-clipboard. v1 does not trigger a remote build for you.

Optional env stub for future CI webhooks:

```env
CMS_PUBLISH_WEBHOOK_URL=https://your-ci-hook.example/hooks/publish
```

Not called in v1 — placeholder only.

## What gets baked into the static site

| Content                     | In static output                                                           |
| --------------------------- | -------------------------------------------------------------------------- |
| Page HTML + `_payload.json` | Yes                                                                        |
| Page list / nav payload     | Yes (when prerendered)                                                     |
| Global regions              | Yes                                                                        |
| Image field URLs            | Yes — optionally localized into `dist/cms-media/` on generate              |
| Editor sidebar / login      | Prerendered routes exist; editing still needs live Supabase when logged in |

## Configure prerender routes

List every public URL:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/', '/about', '/blog'],
      crawlLinks: true, // optional: follow <a href> during generate
    },
  },
})
```

Missing routes = guests may 404 or miss payload for that slug.

## Validate guest behavior

Do **not** use `npm run dev` to test guests — dev always fetches Supabase.

```bash
npm run generate
npx serve dist   # or npm run static if your project defines it
```

Open the site logged out. Network tab should show no Supabase calls for page content on prerendered routes.

## CI suggestion

Typical pipeline:

1. Editor merges content in production Supabase (or staging).
2. CI runs `npm run generate` with Supabase env vars (build must reach DB).
3. CI deploys `dist/`.

Supabase must be reachable at build time so prerender can fetch current content.

## Draft workflow (mental model)

All editor saves are “live” in the database. Only the **static deploy** lags. Think of generate as “release to guests,” not “save draft.”

## Next

[Editing UX](./editing.md) — what editors experience before you publish
