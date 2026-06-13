# Routing and pages

## Route table

| File                                    | URL      | Purpose                            |
| --------------------------------------- | -------- | ---------------------------------- |
| `packages/nuxt-cms/app/pages/login.vue` | `/login` | Sign in / sign out                 |
| `demo/app/pages/[...slug].vue`          | `/*`     | All CMS pages (e.g. `/`, `/about`) |

Nuxt resolves **`login.vue` before the catch-all**, so `/login` is not handled by `[...slug].vue`.

## Catch-all page (`[...slug].vue`)

Single entry point for CMS URLs. It:

1. Normalizes the route path to a **slug** (`normalizeSlug`).
2. Loads **page content** — `useCmsPage()` → `useAsyncData(\`page:${slug}\`, usePageContent)` with guest payload caching.
3. Loads **navigation** — `usePageListData()` with the same guest cache pattern.
4. Resolves **template component** from `content.template.key` via `#cms/registries` → `demo/app/composables/useTemplate.ts`.
5. Wraps the template in **`PageEditorProvider`** when content exists.
6. Syncs loaded content into **`useCmsPanel`** for the logged-in sidebar (slug-matched `watchEffect` — see [CMS sidebar](./cms-sidebar.md)).

## Slugs

`packages/nuxt-cms/app/utils/slug.ts` exports two helpers:

### `normalizeSlug`

Used when resolving a **route path** to a stored slug:

- Leading slash: `/about` not `about`
- No trailing slash except root
- Root is exactly `/`

### `slugify`

Used when **creating a page** (sidebar form and `createPage`):

- Lowercases input
- Replaces spaces with `-`
- Removes non URL-safe characters (keeps `a-z`, `0-9`, `-`, and `/` for nested paths)
- Collapses repeated hyphens
- Applies `normalizeSlug` on the result

Examples: `About Us` → `/about-us`, `/blog/My Post!` → `/blog/my-post`.

The **Pages** tab slug field slugifies as you type. `createPage` runs `slugify` again before insert and rejects empty results.

Database `pages.slug` must match (migration seeds `'/'` for home).

## `useAsyncData` keys

| Key             | Fetcher                                         | Guest cache                           |
| --------------- | ----------------------------------------------- | ------------------------------------- |
| `page:${slug}`  | `usePageContent(slug)`                          | Yes — `getCachedData` when logged out |
| `page-list`     | `usePageList()` via `usePageListData()`         | Yes — `getCachedData` when logged out |
| `global:${key}` | `fetchGlobalContent(key)` via `useGlobalData()` | Yes — same pattern                    |

See [Static generation](./static-generation.md).

## Adding a new page

**In the CMS (logged in):** open the sidebar **Pages** tab, enter a slug (auto-slugified as you type), optional title, and template, then **Create page**.

**In Supabase (or SQL):**

1. Insert into **`pages`**:
   - `slug` — e.g. `/about` (must be URL-safe and normalized)
   - `template_id` — from **`templates`**
   - `title` — optional nav label
2. **Nav** — `usePageListData()` picks up the row on next fetch (or from prerender payload for guests).
3. **Static build** — run `npm run generate`; crawler must reach the URL (link from another prerendered page or add to `nitro.prerender.routes`).
4. **Fields** — first visit **while logged in** seeds rows from `field_schema` if none exist.

There is no `demo/app/pages/about.vue` — the catch-all handles all CMS URLs.

## 404 behavior

`usePageContent` returns `null` when no `pages` row exists → simple “Page not found” UI in `[...slug].vue` (not Nuxt `error.vue`).

## UI states

| Condition              | UI                                      |
| ---------------------- | --------------------------------------- |
| `status === 'pending'` | Loading…                                |
| `!content`             | 404 block                               |
| Unknown template key   | “Unknown template.”                     |
| Otherwise              | `PageEditorProvider` + dynamic template |
