# Static generation

## Commands

| Script | What it does |
| ------ | ------------- |
| `npm run generate` | Build + prerender to `dist/` |
| `npm run static` | `generate` then serve `dist/` on port 8000 |
| `npm run dev` | Dev server with hot reload (**not** static; always uses Supabase) |
| `npm run build` | Production build (Node server preset, not only static) |

For local static preview, use **`npm run static`** or `npx serve dist`.

## Nuxt configuration

From `nuxt.config.ts`:

```ts
nitro: {
  output: { publicDir: 'dist' },
  prerender: {
    crawlLinks: true,
    routes: ['/'],
  },
},
routeRules: {
  '/**': { prerender: true },
},
```

- **`routes: ['/']`** — homepage is always prerendered.
- **`crawlLinks: true`** — Nitro follows `<NuxtLink>` in rendered HTML and prerenders discovered paths.
- **`publicDir: 'dist'`** — matches `npm run server`.

## What gets generated

For each prerendered route (e.g. `/about`):

| Output | Purpose |
| ------ | ------- |
| `dist/about/index.html` | Full HTML with field text in the body |
| `dist/about/_payload.json` | Serialized `useAsyncData` cache for hydration |

Root uses `dist/index.html` and `dist/_payload.json`. SPA fallbacks `200.html` / `404.html` may also be emitted.

## Build-time requirements

During **`nuxt generate`**, the prerender server runs `[...slug].vue` and calls **`usePageContent`**, which hits **Supabase**. You need:

- Valid `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Network access to Supabase
- Migration applied (home page at `/`, etc.)

If Supabase is down or empty, generate can fail or produce empty pages.

## Payload and `useAsyncData`

`[...slug].vue` loads page content with:

```ts
useAsyncData(
  () => `page:${slug.value}`,
  () => usePageContent(slug.value),
  {
    watch: [slug],
    getCachedData(key, nuxtApp) {
      if (loggedIn.value) return undefined
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    },
  },
)
```

`usePageContent` returns a plain object via **`toPageContentPayload()`** so the payload contains no functions or Vue components.

### Logged-out users (static deploy)

When `loggedIn` is false and a prerendered payload exists:

1. **First paint** — content is already in `index.html`.
2. **Hydration** — Nuxt restores `useAsyncData` from `_payload.json` instead of calling the fetcher again.
3. **Client navigation** to another prerendered route — Nuxt loads that route’s `_payload.json` when available.

The Supabase fetcher for **`page:${slug}` should not run** for guests on a successful static deploy, as long as `getCachedData` returns data.

### Logged-in users

- `getCachedData` returns **`undefined`** → fetcher runs → live Supabase data.
- `watch(loggedIn, () => refresh())` refetches when the session changes.
- **`CmsSidebar`** syncs from `[...slug].vue` via `useCmsPanel`; only push content when `data.page.slug` matches the route (avoids stale sidebar data while `useAsyncData` is between pages). Do not clear the panel in `onUnmounted` — Suspense can remount the page on the same URL. See [CMS sidebar](./cms-sidebar.md).

### `page-list` (navigation)

```ts
const { data: pageList } = usePageListData()
```

`usePageListData()` wraps `useAsyncData('page-list', …)` with the same `getCachedData` + `loggedIn` guard as page content. Both `[...slug].vue` (top nav) and `CmsSidebar` (Pages tab) share this key so prerender bakes one nav payload per route.

When `loggedIn` is false and a prerendered payload exists, the Supabase fetcher for **`page-list` should not run** for guests on a successful static deploy.

To verify guest caching: use browser DevTools → Network and filter for your Supabase host. You should see **no** requests for guests on `npm run static`.

## Dev vs static

| Mode | Guest page content | Guest nav |
| ---- | ------------------ | --------- |
| `npm run dev` | Supabase (no `_payload.json`) | Supabase |
| `npm run static` | HTML + `_payload.json` | `_payload.json` (no runtime fetch) |

Do not use `npm run dev` to validate static guest behavior — use **`npm run static`**.

## Crawl limitations

Only pages **linked from an already prerendered page** are discovered automatically. If you add `/new-page` in the DB but nothing links to it:

- Add a nav link (nav uses `usePageList` — appears after generate if the route was crawled from a page that listed it), or
- Add the path to `nitro.prerender.routes`, or
- Call `prerenderRoutes()` from a Nitro hook.

## Prerender pitfalls

### Cannot stringify a function

Nuxt serializes `useState` into `_payload.json`. Do **not** store callbacks in `useState` (e.g. save handlers). `usePageEditor` keeps `fieldUpdatedHandler` in a module-level variable; only `fieldsById` / `fieldsByName` go in `useState`. See [Modal editing](./inline-editing.md).

## Caching vs freshness

| Audience | First paint | Page data after JS | Nav data after JS |
| -------- | ----------- | ------------------- | ----------------- |
| Guest (static) | Prerendered HTML | `_payload.json` | `_payload.json` |
| Editor | May flash public HTML | Supabase | Supabase |

Regenerate **`npm run generate`** after bulk content changes so guests see updated HTML and payloads.

## CMS images in static output

Image fields store Supabase Storage URLs in the database (live for editors). During **`nuxt generate`**, the `localize-cms-images` module hooks **`prerender:done`** (Nitro — after all routes are prerendered):

1. Scans `dist/**/*.html` and `dist/**/_payload.json` for `cms-media` Storage URLs
2. Downloads each file to `dist/cms-media/`
3. Rewrites URLs to local paths (`/cms-media/…`)

Guests on static hosting load images from the same origin as HTML — no Supabase Storage requests. Re-run generate after image uploads to refresh `dist/`.

## Editor store (logged-in)

`useCmsPanel().pageContent` is the single source of truth for in-session edits. `[...slug].vue` reads `displayContent` from `useGhostPage()`, which prefers the panel store when logged in. Modal saves call `patchField` on the store so the sidebar and on-page preview stay in sync. Both sidebar field clicks and `[data-name]` clicks open the same modal via `usePageEditor`.
