# Adopting an existing site

You already have a static Nuxt site (`nuxt generate`, deploy `dist/`). Add the CMS without rewriting your whole app.

## What changes

| Stays yours                                         | Comes from the CMS layer                  |
| --------------------------------------------------- | ----------------------------------------- |
| Branding, layout, nav, routing beyond the catch-all | Editor sidebar, modal, login, composables |
| Which pages exist and how they look                 | Supabase schema, field save pipeline      |
| Static host and deploy flow                         | Prerender + payload caching for guests    |

## Checklist

### 1. Extend the layer

Same as [Getting started § Install](./getting-started.md#1-install-the-cms-layer). Add `extends`, Supabase env, and `prerender.routes`.

If you already prerender, merge your existing `nitro.prerender.routes` with any new CMS-driven pages.

### 2. Replace page content fetching

Pick one approach:

**Catch-all (recommended)** — one `[...slug].vue` loads CMS pages by slug. Keep your existing routes for non-CMS pages (e.g. `/about` stays a normal `pages/about.vue` if you prefer).

**Single landing page** — only `/` uses the CMS; other routes unchanged. Use `pages/index.vue` with `useCmsPage()` instead of a catch-all.

### 3. Add registries + at least one template

Follow [Getting started § 3–4](./getting-started.md#3-wire-registries). Map your existing homepage layout to a template component; move hard-coded strings into fields.

### 4. Opt in to editing

Wrap editable regions with `PageEditorProvider` and put `data-name` on elements that should open the modal (see [Editing UX](./editing.md)).

Add `<CmsSidebar v-if="loggedIn" />` to `app.vue`.

### 5. Static behavior

Your site should already use `routeRules` or `nitro.prerender` from the layer defaults. After adoption:

- **Guests** — page content from prerendered HTML + payload (no Supabase for body content).
- **Editors** — live Supabase; bypass cache when logged in.

Validate with `npm run generate` and serve `dist/` locally — not `npm run dev` (dev always hits Supabase). See [Publishing](./publishing.md).

### 6. Globals and slices (optional)

Add later without breaking existing pages:

- **[Globals](./globals.md)** — replace hard-coded nav labels or footer copy.
- **[Slices](./slices.md)** — stack sections on marketing pages instead of one monolithic template.

## Minimal diff mental model

```text
Before                          After
──────                          ─────
pages/index.vue (static copy)   pages/[...slug].vue + template (CMS fields)
app.vue                         app.vue + CmsSidebar when logged in
nuxt.config (generate)          nuxt.config extends CMS + prerender routes
(no Supabase)                   Supabase migrations + .env
```

## When not to use a catch-all

If your site has many bespoke routes (blog with custom logic, app-like pages), CMS only the marketing shell:

- CMS: `/`, `/pricing`, `/contact`
- Yours: `/app/*`, API routes, dynamic server routes

Nuxt route priority keeps specific files over the catch-all.

## Next

- [Templates](./templates.md) — migrate a existing page layout
- [Publishing](./publishing.md) — fit generate into your CI
